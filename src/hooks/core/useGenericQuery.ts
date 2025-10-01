/**
 * Generic Query Hook
 *
 * Provides a flexible, configurable query hook that integrates with
 * cache configuration, error handling, and selectors for optimal performance.
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type { QueryKeyFactory } from "../utils/queryKeys";
import { CacheConfigManager } from "../utils/queryConfig";
import { ErrorHandler, type AppError } from "../utils/errorHandling";

/**
 * Generic query options interface
 */
export interface GenericQueryOptions<TData, TSelectData = TData> {
	/** Query key factory or array */
	queryKey: QueryKeyFactory | readonly string[];
	/** Query function */
	queryFn: () => Promise<TData>;
	/** Entity name for cache and error handling */
	entityName: string;
	/** Operation name for error tracking */
	operationName?: string;
	/** Selector function */
	selector?: (data: TData) => TSelectData;
	/** Custom cache configuration overrides */
	cacheOverrides?: {
		staleTime?: number;
		gcTime?: number;
		refetchInterval?: number | false;
		retry?: boolean | number;
		retryDelay?: number;
	};
	/** Error handling configuration */
	errorConfig?: {
		retry?: boolean | number;
		retryDelay?: number;
		onError?: (error: AppError) => void;
		fallback?: any;
	};
	/** Additional query options */
	additionalOptions?: {
		enabled?: boolean;
		refetchOnWindowFocus?: boolean;
		refetchOnReconnect?: boolean;
		refetchOnMount?: boolean | "always";
	};
}

/**
 * Generic query hook return type
 */
export interface UseGenericQueryResult<TData, TSelectData = TData> {
	/** Query data */
	data: TSelectData | undefined;
	/** Raw data before selection */
	rawData: TData | undefined;
	/** Error object */
	error: AppError | null;
	/** User-friendly error message */
	errorMessage: string | undefined;
	/** Whether error is critical */
	isCriticalError: boolean;
	/** Loading state */
	isLoading: boolean;
	/** Fetching state */
	isFetching: boolean;
	/** Success state */
	isSuccess: boolean;
	/** Error state */
	isError: boolean;
	/** Retry function */
	retry: () => void;
	/** Refetch function */
	refetch: () => Promise<any>;
}

/**
 * Generic query hook with configurable options
 */
export function useGenericQuery<TData, TSelectData = TData>(
	options: GenericQueryOptions<TData, TSelectData>,
): UseGenericQueryResult<TData, TSelectData> {
	const {
		queryKey,
		queryFn,
		entityName,
		operationName,
		selector,
		cacheOverrides,
		errorConfig,
		additionalOptions,
	} = options;

	// Create query key based on factory or array
	const finalQueryKey = useMemo(() => {
		if (Array.isArray(queryKey)) {
			return queryKey;
		}
		if (typeof queryKey === "object" && "all" in queryKey) {
			return queryKey.all();
		}
		return queryKey;
	}, [queryKey]);

	// Create cache configuration
	const cacheConfig = useMemo(() => {
		const baseConfig = CacheConfigManager.createQueryOptions(
			entityName,
			cacheOverrides,
		);
		return {
			...baseConfig,
			...additionalOptions,
		};
	}, [entityName, cacheOverrides, additionalOptions]);

	// Create error handling configuration
	const errorHandlingConfig = useMemo(() => {
		const config = errorConfig
			? {
					retry: errorConfig.retry ?? 3,
					retryDelay: errorConfig.retryDelay,
					onError: errorConfig.onError,
				}
			: undefined;
		return ErrorHandler.createQueryOptions(entityName, operationName, config);
	}, [entityName, operationName, errorConfig]);

	// Enhanced query function with error handling
	const enhancedQueryFn = useCallback(async (): Promise<TData> => {
		try {
			return await queryFn();
		} catch (error) {
			throw ErrorHandler.handleQueryError(error, entityName, operationName);
		}
	}, [queryFn, entityName, operationName]);

	// Combine all configurations
	const queryOptions = useMemo(
		() => ({
			queryKey: finalQueryKey,
			queryFn: enhancedQueryFn,
			...cacheConfig,
			retry: errorHandlingConfig?.retry,
			retryDelay: errorHandlingConfig?.retryDelay,
		}),
		[finalQueryKey, enhancedQueryFn, cacheConfig, errorHandlingConfig],
	);

	// Execute the query
	const queryResult = useQuery<TData, AppError>(queryOptions);

	// Apply selector if provided
	const data = useMemo(() => {
		if (!queryResult.data) return undefined;
		if (selector) {
			try {
				return selector(queryResult.data);
			} catch (error) {
				console.error("Selector error:", error);
				return queryResult.data as any;
			}
		}
		return queryResult.data as any;
	}, [queryResult.data, selector]);

	// Enhanced error information
	const errorInfo = useMemo(() => {
		if (!queryResult.error) return null;

		const error = queryResult.error;
		return {
			error,
			errorMessage: ErrorHandler.getUserFriendlyMessage(error),
			isCriticalError: ErrorHandler.isCriticalError(error),
		};
	}, [queryResult.error]);

	// Enhanced retry function
	const retry = useCallback(() => {
		queryResult.refetch();
	}, [queryResult]);

	return {
		data,
		rawData: queryResult.data,
		error: queryResult.error || null,
		errorMessage: errorInfo?.errorMessage,
		isCriticalError: errorInfo?.isCriticalError || false,
		isLoading: queryResult.isLoading,
		isFetching: queryResult.isFetching,
		isSuccess: queryResult.isSuccess,
		isError: queryResult.isError,
		retry,
		refetch: queryResult.refetch,
	};
}

/**
 * Hook for list queries with common patterns
 */
export function useGenericListQuery<TData, TSelectData = TData>(
	options: Omit<GenericQueryOptions<TData[], TSelectData[]>, "queryKey"> & {
		queryKey: QueryKeyFactory | readonly string[];
	},
): UseGenericQueryResult<TData[], TSelectData[]> {
	const { queryKey, ...restOptions } = options;

	const finalQueryKey = useMemo(() => {
		if (Array.isArray(queryKey)) {
			return queryKey;
		}
		if (typeof queryKey === "object" && "lists" in queryKey) {
			return queryKey.lists();
		}
		return queryKey;
	}, [queryKey]);

	return useGenericQuery<TData[], TSelectData[]>({
		...restOptions,
		queryKey: finalQueryKey,
	});
}

/**
 * Hook for detail queries with common patterns
 */
export function useGenericDetailQuery<TData, TSelectData = TData>(
	options: Omit<GenericQueryOptions<TData, TSelectData>, "queryKey"> & {
		queryKey: QueryKeyFactory;
		id: string;
	},
): UseGenericQueryResult<TData, TSelectData> {
	const { queryKey, id, ...restOptions } = options;

	return useGenericQuery<TData, TSelectData>({
		...restOptions,
		queryKey: queryKey.byId(id),
		additionalOptions: {
			...restOptions.additionalOptions,
			enabled: !!id && restOptions.additionalOptions?.enabled !== false,
		},
	});
}

/**
 * Hook for user-specific queries with common patterns
 */
export function useGenericUserQuery<TData, TSelectData = TData>(
	options: Omit<GenericQueryOptions<TData[], TSelectData[]>, "queryKey"> & {
		queryKey: QueryKeyFactory;
		userId: string;
	},
): UseGenericQueryResult<TData[], TSelectData[]> {
	const { queryKey, userId, ...restOptions } = options;

	return useGenericQuery<TData[], TSelectData[]>({
		...restOptions,
		queryKey: queryKey.byUser(userId),
		additionalOptions: {
			...restOptions.additionalOptions,
			enabled: !!userId && restOptions.additionalOptions?.enabled !== false,
		},
	});
}

/**
 * Hook for filtered queries with common patterns
 */
export function useGenericFilterQuery<TData, TSelectData = TData>(
	options: Omit<GenericQueryOptions<TData[], TSelectData[]>, "queryKey"> & {
		queryKey: QueryKeyFactory;
		filter: Record<string, any>;
	},
): UseGenericQueryResult<TData[], TSelectData[]> {
	const { queryKey, filter, ...restOptions } = options;

	return useGenericQuery<TData[], TSelectData[]>({
		...restOptions,
		queryKey: queryKey.byFilter(filter),
		additionalOptions: {
			...restOptions.additionalOptions,
			enabled: !!filter && restOptions.additionalOptions?.enabled !== false,
		},
	});
}

/**
 * Default export
 */
export default useGenericQuery;
