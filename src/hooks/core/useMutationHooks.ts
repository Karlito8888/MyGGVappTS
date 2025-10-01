/**
 * Mutation Hooks with Error Handling
 *
 * Provides comprehensive mutation hooks that integrate error handling,
 * optimistic updates, and cache management for consistent behavior.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { QueryKeyFactory } from "../utils/queryKeys";
import { CacheConfigManager } from "../utils/queryConfig";
import { ErrorHandler, type AppError } from "../utils/errorHandling";
import {
	useOptimisticCreate,
	useOptimisticUpdate,
	useOptimisticDelete,
} from "./useOptimistic";

/**
 * Base mutation configuration interface
 */
export interface BaseMutationConfig<TData, TVariables> {
	/** Query key factory for cache management */
	queryKeys: QueryKeyFactory;
	/** Entity name for error handling */
	entityName: string;
	/** Operation name for error tracking */
	operationName: string;
	/** Whether to use optimistic updates */
	optimistic?: boolean;
	/** Success callback */
	onSuccess?: (data: TData, variables: TVariables) => void;
	/** Error callback */
	onError?: (error: AppError, variables: TVariables) => void;
	/** Settled callback */
	onSettled?: (
		data: TData | undefined,
		error: AppError | null,
		variables: TVariables,
	) => void;
	/** Custom retry logic */
	retry?: (failureCount: number, error: AppError) => boolean;
	/** Retry delay */
	retryDelay?: (attemptIndex: number) => number;
	/** Whether to invalidate related queries on success */
	invalidateOnSuccess?: boolean;
	/** Whether to refetch after mutation */
	refetchOnSuccess?: boolean;
}

/**
 * Create mutation configuration
 */
export interface CreateMutationConfig<TData, TVariables>
	extends BaseMutationConfig<TData, TVariables> {
	/** Function to generate temporary ID for optimistic updates */
	generateTempId?: () => string;
	/** Function to create optimistic data */
	createOptimisticData?: (variables: TVariables, tempId: string) => TData;
}

/**
 * Update mutation configuration
 */
export interface UpdateMutationConfig<TData, TVariables>
	extends BaseMutationConfig<TData, { id: string; data: TVariables }> {
	/** Function to update optimistic data */
	updateOptimisticData?: (
		oldData: TData,
		variables: { id: string; data: TVariables },
	) => TData;
}

/**
 * Delete mutation configuration
 */
export interface DeleteMutationConfig extends BaseMutationConfig<void, string> {
	/** Confirmation message for delete operations */
	confirmMessage?: string;
	/** Whether to show confirmation dialog */
	requireConfirmation?: boolean;
}

/**
 * Mutation result interface
 */
export interface MutationResult<TData, TVariables> {
	/** Execute mutation */
	mutate: (variables: TVariables) => void;
	/** Execute mutation asynchronously */
	mutateAsync: (variables: TVariables) => Promise<TData>;
	/** Whether mutation is in progress */
	isPending: boolean;
	/** Whether mutation was successful */
	isSuccess: boolean;
	/** Whether mutation failed */
	isError: boolean;
	/** Mutation error (if any) */
	error: AppError | null;
	/** Mutation data (if successful) */
	data: TData | undefined;
	/** Reset mutation state */
	reset: () => void;
}

/**
 * Hook for create mutations with comprehensive error handling
 */
export function useCreateMutation<TData, TVariables>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	config: CreateMutationConfig<TData, TVariables>,
): MutationResult<TData, TVariables> {
	const queryClient = useQueryClient();
	const cacheConfig = CacheConfigManager.getConfig(config.entityName);

	const {
		queryKeys,
		entityName,
		operationName = "create",
		optimistic = true,
		invalidateOnSuccess = true,
		refetchOnSuccess = false,
		onSuccess,
		onError,
		onSettled,
		...mutationConfig
	} = config;

	// Use optimistic updates if enabled
	if (optimistic) {
		const optimisticResult = useOptimisticCreate(
			mutationFn,
			queryKeys,
			entityName,
			{
				operationName,
				onSuccess: (data, variables) => {
					// Invalidate related queries
					if (invalidateOnSuccess) {
						queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					}

					// Refetch if needed
					if (refetchOnSuccess) {
						queryClient.refetchQueries({ queryKey: queryKeys.all() });
					}

					onSuccess?.(data, variables);
				},
				onError,
				onSettled,
				...mutationConfig,
			},
		);

		return {
			mutate: optimisticResult.mutate,
			mutateAsync: optimisticResult.mutateAsync,
			isPending: optimisticResult.isPending,
			isSuccess: !optimisticResult.isPending && !optimisticResult.error,
			isError: !!optimisticResult.error,
			error: optimisticResult.error,
			data: optimisticResult.data,
			reset: optimisticResult.reset,
		};
	}

	// Standard mutation without optimistic updates
	const mutation = useMutation<TData, Error, TVariables>({
		mutationFn,
		onSuccess: (data, variables) => {
			// Invalidate related queries
			if (invalidateOnSuccess) {
				queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
			}

			// Refetch if needed
			if (refetchOnSuccess) {
				queryClient.refetchQueries({ queryKey: queryKeys.all() });
			}

			onSuccess?.(data, variables);
		},
		onError: (error, variables) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			onError?.(appError, variables);
		},
		onSettled: (data, error, variables) => {
			const appError = error
				? ErrorHandler.handleQueryError(error, entityName, operationName)
				: null;
			onSettled?.(data, appError, variables);
		},
		retry: (failureCount, error) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			return mutationConfig.retry
				? mutationConfig.retry(failureCount, appError)
				: ErrorHandler.shouldRetry(appError, failureCount);
		},
		retryDelay:
			mutationConfig.retryDelay ||
			((attemptIndex: number) =>
				ErrorHandler.calculateRetryDelay(attemptIndex)),
		gcTime: cacheConfig.gcTime,
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
		error: mutation.error
			? ErrorHandler.handleQueryError(mutation.error, entityName, operationName)
			: null,
		data: mutation.data,
		reset: mutation.reset,
	};
}

/**
 * Hook for update mutations with comprehensive error handling
 */
export function useUpdateMutation<TData, TVariables>(
	mutationFn: (id: string, data: TVariables) => Promise<TData>,
	config: UpdateMutationConfig<TData, TVariables>,
): MutationResult<TData, { id: string; data: TVariables }> {
	const queryClient = useQueryClient();
	const cacheConfig = CacheConfigManager.getConfig(config.entityName);

	const {
		queryKeys,
		entityName,
		operationName = "update",
		optimistic = true,
		invalidateOnSuccess = true,
		refetchOnSuccess = false,
		onSuccess,
		onError,
		onSettled,
		...mutationConfig
	} = config;

	// Use optimistic updates if enabled
	if (optimistic) {
		const optimisticResult = useOptimisticUpdate(
			mutationFn,
			queryKeys,
			entityName,
			{
				operationName,
				onSuccess: (data, variables) => {
					// Invalidate related queries
					if (invalidateOnSuccess) {
						queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					}

					// Refetch if needed
					if (refetchOnSuccess) {
						queryClient.refetchQueries({ queryKey: queryKeys.all() });
					}

					onSuccess?.(data, variables);
				},
				onError,
				onSettled,
				...mutationConfig,
			},
		);

		return {
			mutate: optimisticResult.mutate,
			mutateAsync: optimisticResult.mutateAsync,
			isPending: optimisticResult.isPending,
			isSuccess: !optimisticResult.isPending && !optimisticResult.error,
			isError: !!optimisticResult.error,
			error: optimisticResult.error,
			data: optimisticResult.data,
			reset: optimisticResult.reset,
		};
	}

	// Standard mutation without optimistic updates
	const mutation = useMutation<TData, Error, { id: string; data: TVariables }>({
		mutationFn: ({ id, data }) => mutationFn(id, data),
		onSuccess: (data, variables) => {
			// Update specific item query
			queryClient.setQueryData(queryKeys.byId(variables.id), data);

			// Invalidate related queries
			if (invalidateOnSuccess) {
				queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
			}

			// Refetch if needed
			if (refetchOnSuccess) {
				queryClient.refetchQueries({ queryKey: queryKeys.all() });
			}

			onSuccess?.(data, variables);
		},
		onError: (error, variables) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			onError?.(appError, variables);
		},
		onSettled: (data, error, variables) => {
			const appError = error
				? ErrorHandler.handleQueryError(error, entityName, operationName)
				: null;
			onSettled?.(data, appError, variables);
		},
		retry: (failureCount, error) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			return mutationConfig.retry
				? mutationConfig.retry(failureCount, appError)
				: ErrorHandler.shouldRetry(appError, failureCount);
		},
		retryDelay:
			mutationConfig.retryDelay ||
			((attemptIndex: number) =>
				ErrorHandler.calculateRetryDelay(attemptIndex)),
		gcTime: cacheConfig.gcTime,
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
		error: mutation.error
			? ErrorHandler.handleQueryError(mutation.error, entityName, operationName)
			: null,
		data: mutation.data,
		reset: mutation.reset,
	};
}

/**
 * Hook for delete mutations with comprehensive error handling
 */
export function useDeleteMutation(
	mutationFn: (id: string) => Promise<void>,
	config: DeleteMutationConfig,
): MutationResult<void, string> {
	const queryClient = useQueryClient();
	const cacheConfig = CacheConfigManager.getConfig(config.entityName);

	const {
		queryKeys,
		entityName,
		operationName = "delete",
		optimistic = true,
		invalidateOnSuccess = true,
		refetchOnSuccess = false,
		requireConfirmation = false,
		confirmMessage = `Are you sure you want to delete this ${entityName}?`,
		onSuccess,
		onError,
		onSettled,
		...mutationConfig
	} = config;

	// Confirmation wrapper
	const confirmAndDelete = useCallback(
		async (id: string): Promise<void> => {
			if (requireConfirmation) {
				const confirmed = window.confirm(confirmMessage);
				if (!confirmed) {
					throw new Error("Delete operation cancelled by user");
				}
			}
			return mutationFn(id);
		},
		[requireConfirmation, confirmMessage, mutationFn],
	);

	// Use optimistic updates if enabled
	if (optimistic) {
		const optimisticResult = useOptimisticDelete(
			confirmAndDelete,
			queryKeys,
			entityName,
			{
				operationName,
				onSuccess: (data, variables) => {
					// Invalidate related queries
					if (invalidateOnSuccess) {
						queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
					}

					// Refetch if needed
					if (refetchOnSuccess) {
						queryClient.refetchQueries({ queryKey: queryKeys.all() });
					}

					onSuccess?.(data, variables);
				},
				onError,
				onSettled,
				...mutationConfig,
			},
		);

		return {
			mutate: optimisticResult.mutate,
			mutateAsync: optimisticResult.mutateAsync,
			isPending: optimisticResult.isPending,
			isSuccess: !optimisticResult.isPending && !optimisticResult.error,
			isError: !!optimisticResult.error,
			error: optimisticResult.error,
			data: optimisticResult.data,
			reset: optimisticResult.reset,
		};
	}

	// Standard mutation without optimistic updates
	const mutation = useMutation<void, Error, string>({
		mutationFn: confirmAndDelete,
		onSuccess: (data, id) => {
			// Remove specific item query
			queryClient.removeQueries({ queryKey: queryKeys.byId(id) });

			// Invalidate related queries
			if (invalidateOnSuccess) {
				queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
			}

			// Refetch if needed
			if (refetchOnSuccess) {
				queryClient.refetchQueries({ queryKey: queryKeys.all() });
			}

			onSuccess?.(data, id);
		},
		onError: (error, id) => {
			// Don't treat user cancellation as an error
			if (error.message === "Delete operation cancelled by user") {
				return;
			}

			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			onError?.(appError, id);
		},
		onSettled: (data, error, id) => {
			// Don't call settled for user cancellation
			if (error?.message === "Delete operation cancelled by user") {
				return;
			}

			const appError = error
				? ErrorHandler.handleQueryError(error, entityName, operationName)
				: null;
			onSettled?.(data, appError, id);
		},
		retry: (failureCount, error) => {
			// Don't retry user cancellation
			if (error.message === "Delete operation cancelled by user") {
				return false;
			}

			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			return mutationConfig.retry
				? mutationConfig.retry(failureCount, appError)
				: ErrorHandler.shouldRetry(appError, failureCount);
		},
		retryDelay:
			mutationConfig.retryDelay ||
			((attemptIndex: number) =>
				ErrorHandler.calculateRetryDelay(attemptIndex)),
		gcTime: cacheConfig.gcTime,
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
		error: mutation.error
			? ErrorHandler.handleQueryError(mutation.error, entityName, operationName)
			: null,
		data: mutation.data,
		reset: mutation.reset,
	};
}

/**
 * Hook for custom mutations with comprehensive error handling
 */
export function useCustomMutation<TData, TVariables>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	config: BaseMutationConfig<TData, TVariables>,
): MutationResult<TData, TVariables> {
	const queryClient = useQueryClient();
	const cacheConfig = CacheConfigManager.getConfig(config.entityName);

	const {
		queryKeys,
		entityName,
		operationName = "custom",
		invalidateOnSuccess = true,
		refetchOnSuccess = false,
		onSuccess,
		onError,
		onSettled,
		...mutationConfig
	} = config;

	const mutation = useMutation<TData, Error, TVariables>({
		mutationFn,
		onSuccess: (data, variables) => {
			// Invalidate related queries
			if (invalidateOnSuccess && queryKeys) {
				queryClient.invalidateQueries({ queryKey: queryKeys.all() });
			}

			// Refetch if needed
			if (refetchOnSuccess && queryKeys) {
				queryClient.refetchQueries({ queryKey: queryKeys.all() });
			}

			onSuccess?.(data, variables);
		},
		onError: (error, variables) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			onError?.(appError, variables);
		},
		onSettled: (data, error, variables) => {
			const appError = error
				? ErrorHandler.handleQueryError(error, entityName, operationName)
				: null;
			onSettled?.(data, appError, variables);
		},
		retry: (failureCount, error) => {
			const appError = ErrorHandler.handleQueryError(
				error,
				entityName,
				operationName,
			);
			return mutationConfig.retry
				? mutationConfig.retry(failureCount, appError)
				: ErrorHandler.shouldRetry(appError, failureCount);
		},
		retryDelay:
			mutationConfig.retryDelay ||
			((attemptIndex: number) =>
				ErrorHandler.calculateRetryDelay(attemptIndex)),
		gcTime: cacheConfig.gcTime,
	});

	return {
		mutate: mutation.mutate,
		mutateAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
		error: mutation.error
			? ErrorHandler.handleQueryError(mutation.error, entityName, operationName)
			: null,
		data: mutation.data,
		reset: mutation.reset,
	};
}

/**
 * Default exports
 */
export default {
	useCreateMutation,
	useUpdateMutation,
	useDeleteMutation,
	useCustomMutation,
};
