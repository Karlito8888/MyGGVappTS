/**
 * Unified Selector System
 *
 * Combines field selection for database queries with client-side data transformation
 * Provides memoized selectors for performance optimization and field selection capabilities.
 */

import { useMemo } from "react";

// ============================================================================
// FIELD SELECTION SYSTEM (from fieldSelectors.ts)
// ============================================================================

/**
 * Unified Field Selection System
 * Centralizes field selection logic to eliminate duplication and ensure consistency
 */

// Standard field sets for different use cases
export const FIELD_SETS = {
	// Profile fields
	profiles: {
		minimal: ["id", "username", "avatar_url"],
		list: ["id", "username", "avatar_url", "created_at", "is_active"],
		detail: "*", // Full profile for detail views
		owner: "*", // Full profile for owner views
	},

	// Service fields
	services: {
		list: [
			"id",
			"profile_id",
			"category_id",
			"title",
			"description",
			"price",
			"currency",
			"is_active",
			"created_at",
			"updated_at",
		],
		detail: "*",
		owner: "*",
		withCategory: `
			*,
			service_categories!category_id (
				id,
				name,
				is_active
			)
		`,
	},

	// Business fields
	businesses: {
		inside: {
			list: [
				"id",
				"profile_id",
				"category_id",
				"business_name",
				"description",
				"email",
				"website_url",
				"phone_number",
				"phone_type",
				"hours",
				"facebook_url",
				"block",
				"lot",
				"is_active",
				"is_featured",
				"created_at",
				"updated_at",
				"location_id",
			],
			owner: [
				"id",
				"profile_id",
				"category_id",
				"business_name",
				"description",
				"email",
				"website_url",
				"photo_1_url",
				"photo_2_url",
				"photo_3_url",
				"phone_number",
				"phone_type",
				"hours",
				"facebook_url",
				"block",
				"lot",
				"is_active",
				"is_featured",
				"created_at",
				"updated_at",
				"location_id",
			],
		},
		outside: {
			list: [
				"id",
				"profile_id",
				"category_id",
				"business_name",
				"description",
				"phone_number",
				"email",
				"website_url",
				"address",
				"city",
				"postal_code",
				"province",
				"barangay",
				"google_maps_link",
				"hours",
				"facebook_url",
				"phone_type",
				"is_active",
				"is_featured",
				"created_at",
				"updated_at",
			],
			owner: [
				"id",
				"profile_id",
				"category_id",
				"business_name",
				"description",
				"phone_number",
				"email",
				"website_url",
				"address",
				"city",
				"postal_code",
				"province",
				"barangay",
				"google_maps_link",
				"hours",
				"facebook_url",
				"phone_type",
				"photo_1_url",
				"photo_2_url",
				"photo_3_url",
				"is_active",
				"is_featured",
				"created_at",
				"updated_at",
			],
		},
	},

	// Marketplace fields
	marketplace: {
		list: [
			"id",
			"profile_id",
			"title",
			"description",
			"price",
			"currency",
			"listing_type",
			"category",
			"status",
			"is_active",
			"created_at",
			"updated_at",
			"contact_method",
			"is_featured",
			"photo_1_url",
		],
		detail: "*",
	},

	// Message fields
	messages: {
		headers: [
			"id",
			"user_id",
			"title",
			"message",
			"coins_spent",
			"created_at",
			"updated_at",
			"expires_at",
			"is_active",
		],
		withProfile: `
			*,
			profiles:user_id (
				username,
				avatar_url
			)
		`,
	},
} as const;

/**
 * Get field selection string for a specific entity and context
 */
export function getFieldSelection(
	entity: keyof typeof FIELD_SETS,
	context: string,
	subContext?: string,
): string {
	const entityFields = FIELD_SETS[entity];

	if (!entityFields) {
		console.warn(`Unknown entity: ${entity}, using *`);
		return "*";
	}

	// Handle nested contexts (e.g., businesses.inside.list)
	if (
		subContext &&
		typeof entityFields === "object" &&
		context in entityFields
	) {
		const contextFields = (entityFields as any)[context];
		if (
			contextFields &&
			typeof contextFields === "object" &&
			subContext in contextFields
		) {
			const fields = contextFields[subContext];
			return Array.isArray(fields) ? fields.join(", ") : fields;
		}
	}

	// Handle direct contexts
	if (typeof entityFields === "object" && context in entityFields) {
		const fields = (entityFields as any)[context];
		return Array.isArray(fields) ? fields.join(", ") : fields;
	}

	console.warn(`Unknown context: ${context} for entity: ${entity}, using *`);
	return "*";
}

/**
 * Specialized getters for businesses (inside/outside)
 */
export function getBusinessFields(
	type: "inside" | "outside",
	context: "list" | "owner",
): string {
	return getFieldSelection("businesses", type, context);
}

/**
 * Utility functions for common field selection patterns
 */
export const FieldSelectors = {
	/**
	 * Get minimal fields for list views (performance optimized)
	 */
	forList: (entity: keyof typeof FIELD_SETS) =>
		getFieldSelection(entity, "list"),

	/**
	 * Get detailed fields for single item views
	 */
	forDetail: (entity: keyof typeof FIELD_SETS) =>
		getFieldSelection(entity, "detail"),

	/**
	 * Get owner fields (includes sensitive data like photos)
	 */
	forOwner: (entity: keyof typeof FIELD_SETS) =>
		getFieldSelection(entity, "owner"),

	/**
	 * Get minimal fields for performance-critical contexts
	 */
	forMinimal: (entity: keyof typeof FIELD_SETS) =>
		getFieldSelection(entity, "minimal"),

	/**
	 * Get fields with related data (joins)
	 */
	withRelations: (entity: keyof typeof FIELD_SETS, relation: string) => {
		if (entity === "services" && relation === "category") {
			return getFieldSelection(entity, "withCategory");
		}
		if (entity === "messages" && relation === "profile") {
			return getFieldSelection(entity, "withProfile");
		}
		return getFieldSelection(entity, "detail");
	},
};

// ============================================================================
// CLIENT-SIDE SELECTOR SYSTEM
// ============================================================================

/**
 * Base selector configuration interface
 */
export interface SelectorConfig<T> {
	/** Selector for grid view - minimal fields */
	forGrid?: (data: T[]) => Partial<T>[];
	/** Selector for card view - moderate fields */
	forCard?: (data: T[]) => Partial<T>[];
	/** Selector for detail view - full object */
	forDetail?: (data: T) => T;
	/** Filter for active items only */
	activeOnly?: (data: T[]) => T[];
	/** Custom filter function */
	filter?: (data: T[], filterFn: (item: T) => boolean) => T[];
	/** Sort function */
	sort?: (data: T[], sortFn: (a: T, b: T) => number) => T[];
}

/**
 * Field selection configuration
 */
export interface FieldSelectionConfig {
	/** Fields to include in grid view */
	gridFields?: string[];
	/** Fields to include in card view */
	cardFields?: string[];
	/** Fields to include in detail view */
	detailFields?: string[];
	/** Fields to always exclude */
	excludeFields?: string[];
}

/**
 * Selector factory for creating optimized selectors
 */
export const SelectorFactory = {
	/**
	 * Create a grid selector with specified fields
	 */
	createGridSelector:
		<T>(fields: string[]): ((data: T[]) => Partial<T>[]) =>
		(data: T[]): Partial<T>[] =>
			data.map((item) => {
				const result: Partial<T> = {};
				for (const field of fields) {
					if (field in (item as any)) {
						(result as any)[field] = (item as any)[field];
					}
				}
				return result;
			}),

	/**
	 * Create a card selector with specified fields
	 */
	createCardSelector:
		<T>(fields: string[]): ((data: T[]) => Partial<T>[]) =>
		(data: T[]): Partial<T>[] =>
			data.map((item) => {
				const result: Partial<T> = {};
				for (const field of fields) {
					if (field in (item as any)) {
						(result as any)[field] = (item as any)[field];
					}
				}
				return result;
			}),

	/**
	 * Create a detail selector with specified fields
	 */
	createDetailSelector:
		<T>(fields: string[]): ((data: T) => T) =>
		(data: T): T => {
			const result: any = {};
			for (const field of fields) {
				if (field in (data as any)) {
					result[field] = (data as any)[field];
				}
			}
			return result;
		},

	/**
	 * Create an active filter for entities with is_active field
	 */
	createActiveFilter:
		<T>(activeField = "is_active"): ((data: T[]) => T[]) =>
		(data: T[]): T[] =>
			data.filter((item) => {
				const isActive = (item as any)[activeField];
				return isActive !== false && isActive !== 0;
			}),

	/**
	 * Create a custom filter
	 */
	createFilter:
		<T>(filterFn: (item: T) => boolean): ((data: T[]) => T[]) =>
		(data: T[]): T[] =>
			data.filter(filterFn),

	/**
	 * Create a sort selector
	 */
	createSort:
		<T>(sortFn: (a: T, b: T) => number): ((data: T[]) => T[]) =>
		(data: T[]): T[] =>
			[...data].sort(sortFn),

	/**
	 * Create a search selector
	 */
	createSearch: <T>(
		searchFields: string[],
		searchTerm: string,
	): ((data: T[]) => T[]) => {
		const term = searchTerm.toLowerCase();
		return (data: T[]): T[] =>
			data.filter((item) =>
				searchFields.some((field) => {
					const value = (item as any)[field];
					return (
						value &&
						typeof value === "string" &&
						value.toLowerCase().includes(term)
					);
				}),
			);
	},

	/**
	 * Create a pagination selector
	 */
	createPagination<T>(page: number, pageSize: number): (data: T[]) => T[] {
		return (data: T[]): T[] => {
			const startIndex = (page - 1) * pageSize;
			return data.slice(startIndex, startIndex + pageSize);
		};
	},

	/**
	 * Create a custom filter
	 */
	createUnique<T>(uniqueField: string): (data: T[]) => T[] {
		const seen = new Set();
		return (data: T[]): T[] =>
			data.filter((item) => {
				const value = (item as any)[uniqueField];
				if (seen.has(value)) {
					return false;
				}
				seen.add(value);
				return true;
			});
	},
};

/**
 * Memoized selector hooks for performance optimization
 */
export function useMemoizedSelector<T, R>(
	data: T[] | undefined,
	selector: (data: T[]) => R,
	dependencies: any[] = [],
): R | undefined {
	return useMemo(() => {
		if (!data) return undefined;
		return selector(data);
	}, [data, selector, ...dependencies]);
}

/**
 * Hook for creating dynamic selectors based on field configuration
 */
export function useFieldSelector<T>(
	data: T[] | undefined,
	config: FieldSelectionConfig,
) {
	return useMemo(() => {
		if (!data) return { grid: [], card: [], detail: null };

		const { gridFields, cardFields, detailFields, excludeFields } = config;

		// Create grid selector
		const gridSelector = gridFields
			? SelectorFactory.createGridSelector(gridFields)
			: (items: T[]) => items;

		// Create card selector
		const cardSelector = cardFields
			? SelectorFactory.createCardSelector(cardFields)
			: (items: T[]) => items;

		// Create detail selector
		const detailSelector = detailFields
			? SelectorFactory.createDetailSelector(detailFields)
			: (item: T) => item;

		// Apply exclusion if specified
		const processedData = excludeFields
			? data.map((item) => {
					const result: any = { ...item };
					for (const field of excludeFields) {
						delete result[field];
					}
					return result;
				})
			: data;

		return {
			grid: gridSelector(processedData),
			card: cardSelector(processedData),
			detail:
				processedData.length > 0 ? detailSelector(processedData[0]) : null,
		};
	}, [data, config]);
}

/**
 * Pre-defined selectors for common entity types
 */
export const CommonSelectors = {
	/**
	 * Profile selectors
	 */
	profiles: {
		grid: SelectorFactory.createGridSelector(["id", "username", "avatar_url"]),
		card: SelectorFactory.createCardSelector([
			"id",
			"username",
			"full_name",
			"avatar_url",
		]),
		detail: SelectorFactory.createDetailSelector([
			"id",
			"username",
			"full_name",
			"avatar_url",
			"bio",
			"created_at",
		]),
		activeOnly: SelectorFactory.createActiveFilter(),
	},

	/**
	 * Service selectors
	 */
	services: {
		grid: SelectorFactory.createGridSelector([
			"id",
			"title",
			"price",
			"category_id",
		]),
		card: SelectorFactory.createCardSelector([
			"id",
			"title",
			"description",
			"price",
			"category_id",
			"provider_id",
		]),
		detail: SelectorFactory.createDetailSelector([
			"id",
			"title",
			"description",
			"price",
			"category_id",
			"provider_id",
			"created_at",
		]),
		activeOnly: SelectorFactory.createActiveFilter(),
	},

	/**
	 * Business selectors
	 */
	businesses: {
		grid: SelectorFactory.createGridSelector([
			"id",
			"name",
			"category",
			"location",
		]),
		card: SelectorFactory.createCardSelector([
			"id",
			"name",
			"description",
			"category",
			"location",
			"rating",
		]),
		detail: SelectorFactory.createDetailSelector([
			"id",
			"name",
			"description",
			"category",
			"location",
			"rating",
			"contact_info",
		]),
		activeOnly: SelectorFactory.createActiveFilter(),
	},

	/**
	 * Message selectors
	 */
	messages: {
		grid: SelectorFactory.createGridSelector([
			"id",
			"content",
			"sender_id",
			"created_at",
		]),
		card: SelectorFactory.createCardSelector([
			"id",
			"content",
			"sender_id",
			"conversation_id",
			"created_at",
		]),
		detail: SelectorFactory.createDetailSelector([
			"id",
			"content",
			"sender_id",
			"conversation_id",
			"created_at",
			"updated_at",
		]),
		// Messages headers specific selectors
		forHeaders: SelectorFactory.createGridSelector([
			"id",
			"user_id",
			"message",
			"created_at",
			"updated_at",
			"coins_spent",
			"expires_at",
		]),
		activeOnly: SelectorFactory.createFilter(
			(message: any) =>
				!message.expires_at || new Date(message.expires_at) > new Date(),
		),
	},

	/**
	 * Marketplace selectors
	 */
	marketplace: {
		grid: SelectorFactory.createGridSelector([
			"id",
			"title",
			"price",
			"seller_id",
		]),
		card: SelectorFactory.createCardSelector([
			"id",
			"title",
			"description",
			"price",
			"seller_id",
			"category",
		]),
		detail: SelectorFactory.createDetailSelector([
			"id",
			"title",
			"description",
			"price",
			"seller_id",
			"category",
			"condition",
			"created_at",
		]),
		activeOnly: SelectorFactory.createActiveFilter(),
	},
} as const;

/**
 * Utility functions for selector composition
 */
export const SelectorUtils = {
	/**
	 * Combine multiple selectors
	 */
	combine<T, R1, R2>(
		selector1: (data: T[]) => R1,
		selector2: (data: T[]) => R2,
	): (data: T[]) => [R1, R2] {
		return (data: T[]): [R1, R2] => [selector1(data), selector2(data)];
	},

	/**
	 * Create a conditional selector
	 */
	conditional<T, R>(
		condition: boolean,
		trueSelector: (data: T[]) => R,
		falseSelector: (data: T[]) => R,
	): (data: T[]) => R {
		return (data: T[]): R =>
			condition ? trueSelector(data) : falseSelector(data);
	},

	/**
	 * Create a selector with fallback
	 */
	withFallback<T, R>(
		selector: (data: T[]) => R,
		fallback: R,
	): (data: T[]) => R {
		return (data: T[]): R => (data.length > 0 ? selector(data) : fallback);
	},
};

/**
 * Default export for convenience
 */
/**
 * Legacy exports for backward compatibility
 * TODO: Remove when legacy hooks are migrated
 */
export const messageSelectors = CommonSelectors.messages;
export const marketplaceSelectors = {
	...CommonSelectors.marketplace,
	forGrid: CommonSelectors.marketplace.grid,
	forDetail: CommonSelectors.marketplace.detail,
	activeOnly: SelectorFactory.createFilter(
		(listing: any) => listing.status === "available",
	),
};

export default SelectorFactory;
