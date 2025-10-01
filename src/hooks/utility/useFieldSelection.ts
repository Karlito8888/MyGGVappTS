import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
	DEFAULT_FIELD_CONFIGS,
	FieldSelectionMonitor,
	createFieldSelectionQueryKey,
	getSelectedFields,
	getSmartFieldSelection,
} from "../../lib/fieldSelection";
import type { FieldSelectionConfig } from "../../lib/fieldSelection";
import { supabase } from "../../lib/supabase";

/**
 * Supported entity types for field selection
 */
export type EntityType =
	| "profiles"
	| "services"
	| "businesses"
	| "marketplace"
	| "messages"
	| "locations";

/**
 * Hook for field-selective data queries
 * Optimizes data fetching by loading only necessary fields
 */
export function useFieldSelectiveQuery<T = unknown>(
	entity: EntityType,
	config: FieldSelectionConfig,
	queryFn: (fields: string[]) => Promise<T[]>,
	options: {
		enabled?: boolean;
		staleTime?: number;
		gcTime?: number;
		retry?: boolean;
	} = {},
) {
	const queryClient = useQueryClient();
	const {
		enabled = true,
		staleTime = 1000 * 60 * 2,
		gcTime = 1000 * 60 * 5,
		retry = true,
	} = options;

	// Get selected fields based on configuration
	const selectedFields = useMemo(() => {
		const fields = getSelectedFields(entity, config);

		// Track usage for optimization
		if (import.meta.env.DEV) {
			const totalFields = Object.keys(
				DEFAULT_FIELD_CONFIGS[
					`${entity.charAt(0).toUpperCase() + entity.slice(1)}Edit` as keyof typeof DEFAULT_FIELD_CONFIGS
				] || {},
			).length;
			FieldSelectionMonitor.trackUsage(entity, "query", fields, totalFields);
		}

		return fields;
	}, [entity, config]);

	// Create query key with field selection
	const queryKey = useMemo(
		() => createFieldSelectionQueryKey([entity], entity, config),
		[entity, config],
	);

	const query = useQuery({
		queryKey,
		queryFn: () => queryFn(selectedFields),
		enabled,
		staleTime,
		gcTime,
		retry,
	});

	// Prefetch with different field configurations
	const prefetchWithConfig = useCallback(
		async (newConfig: FieldSelectionConfig) => {
			const newFields = getSelectedFields(entity, newConfig);
			const newQueryKey = createFieldSelectionQueryKey(
				[entity],
				entity,
				newConfig,
			);

			await queryClient.prefetchQuery({
				queryKey: newQueryKey,
				queryFn: () => queryFn(newFields),
				staleTime: 1000 * 60 * 5, // 5 minutes for prefetched data
			});
		},
		[entity, queryClient, queryFn],
	);

	return {
		...query,
		selectedFields,
		prefetchWithConfig,
		// Convenience getters
		data: query.data || [],
	};
}

/**
 * Hook for field-selective Supabase queries
 * Provides optimized Supabase queries with field selection
 */
export function useFieldSelectiveSupabaseQuery(
	entity: EntityType,
	config: FieldSelectionConfig,
	tableName: string,
	options: {
		enabled?: boolean;
		filters?: Record<string, unknown>;
		relations?: Record<string, string[]>;
		orderBy?: { column: string; ascending?: boolean };
		limit?: number;
	} = {},
) {
	const { enabled = true, filters = {}, orderBy, limit } = options;

	const queryFn = useCallback(
		async (fields: string[]) => {
			let query = supabase.from(tableName).select(fields.join(", "));

			// Apply filters
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					if (Array.isArray(value)) {
						query = query.in(key, value);
					} else {
						query = query.eq(key, value);
					}
				}
			}

			// Apply ordering
			if (orderBy) {
				query = query.order(orderBy.column, {
					ascending: orderBy.ascending ?? false,
				});
			}

			// Apply limit
			if (limit) {
				query = query.limit(limit);
			}

			const { data, error } = await query;

			if (error) throw error;
			return data || [];
		},
		[tableName, filters, orderBy, limit],
	);

	return useFieldSelectiveQuery(entity, config, queryFn, { enabled });
}

/**
 * Hook for smart field selection based on context
 * Automatically selects optimal fields based on usage context
 */
export function useSmartFieldSelection<T = unknown>(
	entity: EntityType,
	context: "list" | "detail" | "edit" | "card" | "search",
	userPreferences?: {
		preferMinimalData?: boolean;
		customFields?: Record<string, string[]>;
	},
	options: {
		enabled?: boolean;
		filters?: Record<string, unknown>;
		relations?: Record<string, string[]>;
		orderBy?: { column: string; ascending?: boolean };
		limit?: number;
		tableName?: string;
		customQueryFn?: (fields: string[]) => Promise<T[]>;
	} = {},
) {
	const {
		enabled = true,
		filters = {},
		relations = {},
		orderBy,
		limit,
		tableName,
		customQueryFn,
	} = options;

	// Get smart field selection configuration
	const config = useMemo(
		() => getSmartFieldSelection(entity, context, userPreferences),
		[entity, context, userPreferences],
	);

	if (customQueryFn) {
		return useFieldSelectiveQuery(entity, config, customQueryFn, {
			enabled,
		});
	}

	if (tableName) {
		return useFieldSelectiveSupabaseQuery(entity, config, tableName, {
			enabled,
			filters,
			relations,
			orderBy,
			limit,
		});
	}

	throw new Error("Either tableName or customQueryFn must be provided");
}

/**
 * Hook for field-selective single record queries
 * Optimized for fetching individual records with selective fields
 */
export function useFieldSelectiveRecord(
	entity: EntityType,
	recordId: string,
	config: FieldSelectionConfig,
	tableName: string,
	options: {
		enabled?: boolean;
		relations?: Record<string, string[]>;
	} = {},
) {
	const { enabled = true, relations = {} } = options;

	const queryFn = useCallback(
		async (fields: string[]) => {
			let selectFields = fields.join(", ");

			// Apply relation selections
			if (Object.keys(relations).length > 0) {
				const relationSelects = Object.entries(relations)
					.map(
						([relation, relationFields]) =>
							`${relation}(${relationFields.join(", ")})`,
					)
					.join(", ");
				selectFields = `${selectFields}, ${relationSelects}`;
			}

			const { data, error } = await supabase
				.from(tableName)
				.select(selectFields)
				.eq("id", recordId)
				.single();

			if (error) throw error;
			return data;
		},
		[recordId, tableName, relations],
	);

	const queryKey = useMemo(
		() => [
			...createFieldSelectionQueryKey([entity, "detail"], entity, config),
			recordId,
		],
		[entity, config, recordId],
	);

	const query = useQuery({
		queryKey,
		queryFn: () => queryFn(getSelectedFields(entity, config)),
		enabled: enabled && !!recordId,
		staleTime: 1000 * 60 * 2, // 2 minutes
		gcTime: 1000 * 60 * 5, // 5 minutes
	});

	return {
		...query,
		selectedFields: getSelectedFields(entity, config),
		// Convenience getter
		data: query.data,
	};
}

/**
 * Hook for field selection optimization monitoring
 * Provides insights and suggestions for field selection optimization
 */
export function useFieldSelectionOptimization() {
	const queryClient = useQueryClient();

	const getOptimizationSuggestions = useCallback(() => {
		const suggestions: string[] = [];

		// Analyze current queries for optimization opportunities
		const queryCache = queryClient.getQueryCache();
		const queries = queryCache.getAll();

		for (const query of queries) {
			const queryKey = query.queryKey;

			// Check if this is a field selection query
			if (Array.isArray(queryKey) && queryKey.includes("field-selection")) {
				const entityIndex = queryKey.indexOf("field-selection") + 1;
				if (entityIndex < queryKey.length) {
					const entity = queryKey[entityIndex] as EntityType;
					const preset = queryKey[entityIndex + 1] as string;

					// Suggest optimization based on preset and context
					if (preset === "COMPLETE" && query.state.data) {
						suggestions.push(
							`Consider using ESSENTIAL preset for ${entity} queries to reduce data transfer`,
						);
					}
				}
			}
		}

		return suggestions;
	}, [queryClient]);

	const getFieldSelectionStats = useCallback(() => {
		const stats = {
			totalQueries: 0,
			fieldSelectionQueries: 0,
			averageFieldCount: 0,
			optimizationOpportunities: 0,
		};

		const queryCache = queryClient.getQueryCache();
		const queries = queryCache.getAll();

		for (const query of queries) {
			stats.totalQueries++;

			const queryKey = query.queryKey;
			if (Array.isArray(queryKey) && queryKey.includes("field-selection")) {
				stats.fieldSelectionQueries++;

				// Calculate average field count (simplified)
				if (query.state.data && Array.isArray(query.state.data)) {
					const sampleRecord = query.state.data[0];
					if (sampleRecord) {
						stats.averageFieldCount += Object.keys(sampleRecord).length;
					}
				}
			}
		}

		if (stats.fieldSelectionQueries > 0) {
			stats.averageFieldCount = Math.round(
				stats.averageFieldCount / stats.fieldSelectionQueries,
			);
		}

		return stats;
	}, [queryClient]);

	return {
		getOptimizationSuggestions,
		getFieldSelectionStats,
	};
}

/**
 * Default field selection configurations for common use cases
 */
export const useFieldSelectionConfigs = () => {
	return {
		// List views - optimized for performance
		list: {
			profiles: DEFAULT_FIELD_CONFIGS.userList,
			services: DEFAULT_FIELD_CONFIGS.serviceList,
			businesses: DEFAULT_FIELD_CONFIGS.businessList,
			marketplace: DEFAULT_FIELD_CONFIGS.marketplaceList,
		},
		// Card views - minimal data for display
		card: {
			profiles: DEFAULT_FIELD_CONFIGS.userCard,
			services: DEFAULT_FIELD_CONFIGS.serviceCard,
			businesses: DEFAULT_FIELD_CONFIGS.businessCard,
		},
		// Detail views - essential data with relations
		detail: {
			profiles: DEFAULT_FIELD_CONFIGS.userDetail,
			services: DEFAULT_FIELD_CONFIGS.serviceDetail,
			businesses: DEFAULT_FIELD_CONFIGS.businessDetail,
		},
		// Edit forms - complete data for editing
		edit: {
			profiles: DEFAULT_FIELD_CONFIGS.userEdit,
			services: DEFAULT_FIELD_CONFIGS.serviceEdit,
			businesses: DEFAULT_FIELD_CONFIGS.businessEdit,
		},
	};
};
