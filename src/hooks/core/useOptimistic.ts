/**
 * Optimistic Updates System
 *
 * Provides reusable optimistic update logic with temporary ID generation,
 * rollback mechanisms, and patterns for different entity types.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import type { QueryKeyFactory } from "../utils/queryKeys";
import { ErrorHandler, type AppError } from "../utils/errorHandling";

/**
 * Optimistic update configuration interface
 */
export interface OptimisticConfig<TData, TVariables> {
	/** Query key factory for cache management */
	queryKeys: QueryKeyFactory;
	/** Entity name for error handling */
	entityName: string;
	/** Operation name for error tracking */
	operationName: string;
	/** Whether optimistic updates are enabled */
	enabled?: boolean;
	/** Function to generate temporary IDs */
	generateTempId?: (prefix?: string) => string;
	/** Function to create optimistic data from variables */
	createOptimisticData?: (variables: TVariables, tempId: string) => TData;
	/** Function to update existing data */
	updateOptimisticData?: (oldData: TData, variables: TVariables) => TData;
	/** Function to extract item ID from variables */
	getItemId?: (variables: TVariables) => string;
	/** Success callback */
	onSuccess?: (data: any, variables: TVariables) => void;
	/** Error callback */
	onError?: (error: AppError, variables: TVariables) => void;
	/** Settled callback */
	onSettled?: (
		data: any,
		error: AppError | null,
		variables: TVariables,
	) => void;
	/** Custom retry logic */
	retry?: (failureCount: number, error: AppError) => boolean;
	/** Retry delay */
	retryDelay?: (attemptIndex: number) => number;
}

/**
 * Optimistic update context interface
 */
export interface OptimisticContext<TData> {
	/** Previous data before optimistic update */
	previousData?: any;
	/** Temporary ID for optimistic items */
	tempId?: string;
	/** Optimistic data */
	optimisticData?: TData;
}

/**
 * Temporary ID generator
 */
export const TempIdGenerator = (() => {
	let counter = 0;

	return {
		/**
		 * Generate a temporary ID
		 */
		generate: (prefix?: string): string => {
			const actualPrefix = prefix || "temp";
			return `${actualPrefix}-${Date.now()}-${++counter}`;
		},

		/**
		 * Generate a UUID-like temporary ID
		 */
		generateUUID: (): string =>
			"temp-xxxx-xxxx-4xxx-yxxx-xxxxx".replace(/[xy]/g, (c) => {
				const r = (Math.random() * 16) | 0;
				const v = c === "x" ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			}),

		/**
		 * Reset counter (useful for tests)
		 */
		reset: (): void => {
			counter = 0;
		},
	};
})();

/**
 * Optimistic update utilities
 */
export const OptimisticUtils = {
	/**
	 * Create optimistic data for create operations
	 */
	createOptimisticData: <TData, TVariables>(
		variables: TVariables,
		tempId: string,
		baseData: Partial<TData> = {},
	): TData =>
		({
			...baseData,
			...variables,
			id: tempId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}) as TData,

	/**
	 * Update existing data optimistically
	 */
	updateOptimisticData: <TData, TVariables>(
		oldData: TData,
		variables: TVariables,
	): TData =>
		({
			...oldData,
			...variables,
			updated_at: new Date().toISOString(),
		}) as TData,

	/**
	 * Check if an item is temporary
	 */
	isTemporaryItem: (item: any): boolean =>
		item?.id?.toString().startsWith("temp-"),

	/**
	 * Extract temporary ID from item
	 */
	getTempId: (item: any): string | null =>
		OptimisticUtils.isTemporaryItem(item) ? item.id : null,

	/**
	 * Replace temporary item with real data
	 */
	replaceTempItem: <TData>(
		items: TData[],
		tempId: string,
		realData: TData,
	): TData[] =>
		items.map((item) => ((item as any).id === tempId ? realData : item)),

	/**
	 * Remove temporary item from list
	 */
	removeTempItem: <TData>(items: TData[], tempId: string): TData[] =>
		items.filter((item) => (item as any).id !== tempId),
};

/**
 * Hook for optimistic mutations
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	config: OptimisticConfig<TData, TVariables>,
) {
	const queryClient = useQueryClient();
	const mutationIdRef = useRef<string | undefined>(undefined);

	const {
		queryKeys,
		entityName,
		operationName,
		enabled = true,
		generateTempId = () => TempIdGenerator.generate(),
		createOptimisticData = OptimisticUtils.createOptimisticData,
		updateOptimisticData = OptimisticUtils.updateOptimisticData,
		getItemId,
		onSuccess,
		onError,
		onSettled,
		retry,
		retryDelay,
	} = config;

	const mutation = useMutation<
		TData,
		TError,
		TVariables,
		OptimisticContext<TData>
	>({
		mutationFn,
		onMutate: async (variables): Promise<OptimisticContext<TData>> => {
			if (!enabled) return {};

			// Generate unique mutation ID
			mutationIdRef.current = generateTempId("mutation");

			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.all() });

			// Snapshot previous values
			const previousData = queryClient.getQueryData(queryKeys.lists());
			const context: OptimisticContext<TData> = {
				previousData,
				tempId: mutationIdRef.current,
			};

			try {
				// Handle different operation types
				if (operationName === "create") {
					const tempId = generateTempId("temp");
					const optimisticData = createOptimisticData(
						variables,
						tempId,
					) as TData;

					// Add optimistic item to list
					queryClient.setQueriesData(
						{ queryKey: queryKeys.lists() },
						(old: any) => [...(old || []), optimisticData],
					);

					context.optimisticData = optimisticData;
					context.tempId = tempId;
				} else if (operationName === "update" && getItemId) {
					const itemId = getItemId(variables);

					// Update item optimistically
					queryClient.setQueriesData(
						{ queryKey: queryKeys.lists() },
						(old: any) =>
							old?.map((item: any) =>
								item.id === itemId
									? updateOptimisticData(item, variables)
									: item,
							),
					);

					// Update specific item query
					queryClient.setQueryData(queryKeys.byId(itemId), (old: any) =>
						old ? updateOptimisticData(old, variables) : undefined,
					);
				} else if (operationName === "delete" && getItemId) {
					const itemId = getItemId(variables);

					// Remove item optimistically
					queryClient.setQueriesData(
						{ queryKey: queryKeys.lists() },
						(old: any) => old?.filter((item: any) => item.id !== itemId),
					);

					// Remove specific item query
					queryClient.removeQueries({ queryKey: queryKeys.byId(itemId) });
				}

				return context;
			} catch (error) {
				console.error("Optimistic update error:", error);
				return context;
			}
		},

		onError: (error: TError, variables, context) => {
			// Rollback on error
			if (context?.previousData) {
				queryClient.setQueriesData(
					{ queryKey: queryKeys.lists() },
					() => context.previousData,
				);
			}

			// Handle error callback
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			onError?.(appError, variables);
		},

		onSuccess: (data, variables, context) => {
			if (!enabled) {
				onSuccess?.(data, variables);
				return;
			}

			// Replace optimistic data with real data
			if (operationName === "create" && context?.tempId) {
				// Replace temporary item with real data
				queryClient.setQueriesData(
					{ queryKey: queryKeys.lists() },
					(old: any) =>
						old
							? OptimisticUtils.replaceTempItem(old, context.tempId || "", data)
							: [data],
				);
			} else if (operationName === "update" && getItemId) {
				const itemId = getItemId(variables);

				// Update with real data
				queryClient.setQueriesData(
					{ queryKey: queryKeys.lists() },
					(old: any) =>
						old?.map((item: any) => (item.id === itemId ? data : item)),
				);

				queryClient.setQueryData(queryKeys.byId(itemId), data);
			}

			// Invalidate related queries
			queryClient.invalidateQueries({ queryKey: queryKeys.lists() });

			// Handle success callback
			onSuccess?.(data, variables);
		},

		onSettled: (data, error, variables) => {
			// Always invalidate to ensure consistency
			queryClient.invalidateQueries({ queryKey: queryKeys.all() });

			// Handle settled callback
			const appError = error
				? ErrorHandler.handleQueryError(error, entityName, operationName)
				: null;
			onSettled?.(data, appError, variables);
		},

		retry: (failureCount, error: TError) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			return retry
				? retry(failureCount, appError)
				: ErrorHandler.shouldRetry(appError, failureCount);
		},

		retryDelay:
			retryDelay ||
			((attemptIndex: number) =>
				ErrorHandler.calculateRetryDelay(attemptIndex)),
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		error: mutation.error
			? ErrorHandler.handleQueryError(mutation.error, entityName, operationName)
			: null,
		reset: mutation.reset,
		data: mutation.data,
	};
}

/**
 * Hook for create operations with optimistic updates
 */
export function useOptimisticCreate<TData, TVariables>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	queryKeys: QueryKeyFactory,
	entityName: string,
	options?: Partial<OptimisticConfig<TData, TVariables>>,
) {
	return useOptimisticMutation(mutationFn, {
		queryKeys,
		entityName,
		operationName: "create",
		generateTempId: () => TempIdGenerator.generate("temp"),
		createOptimisticData: OptimisticUtils.createOptimisticData,
		...options,
	});
}

/**
 * Hook for update operations with optimistic updates
 */
export function useOptimisticUpdate<TData, TVariables>(
	mutationFn: (id: string, data: TVariables) => Promise<TData>,
	queryKeys: QueryKeyFactory,
	entityName: string,
	options?: Partial<OptimisticConfig<TData, { id: string; data: TVariables }>>,
) {
	return useOptimisticMutation(
		({ id, data }: { id: string; data: TVariables }) => mutationFn(id, data),
		{
			queryKeys,
			entityName,
			operationName: "update",
			getItemId: (variables) => variables.id,
			updateOptimisticData: (oldData, variables) => ({
				...oldData,
				...variables.data,
				updated_at: new Date().toISOString(),
			}),
			...options,
		},
	);
}

/**
 * Hook for delete operations with optimistic updates
 */
export function useOptimisticDelete(
	mutationFn: (id: string) => Promise<void>,
	queryKeys: QueryKeyFactory,
	entityName: string,
	options?: Partial<OptimisticConfig<void, string>>,
) {
	return useOptimisticMutation<void, string, Error>(mutationFn, {
		queryKeys,
		entityName,
		operationName: "delete",
		getItemId: (id: string) => id,
		...options,
	});
}

/**
 * Default export
 */
export default useOptimisticMutation;
