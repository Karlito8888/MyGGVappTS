/**
 * Generic CRUD Hook Factory
 *
 * Provides a comprehensive CRUD operations factory that creates
 * standardized hooks for entities with configurable options,
 * optimistic updates, and coordinated cache management.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { QueryKeyFactory } from "../utils/queryKeys";
import { ErrorHandler, type AppError } from "../utils/errorHandling";
import { useGenericQuery, type UseGenericQueryResult } from "./useGenericQuery";

/**
 * CRUD configuration interface
 */
export interface CRUDConfig<TData, TCreateData, TUpdateData> {
	/** Entity name */
	entityName: string;
	/** Query key factory */
	queryKeys: QueryKeyFactory;
	/** Table name in database */
	tableName: string;
	/** Query function for fetching data */
	queryFn: () => Promise<TData[]>;
	/** Query function for fetching by ID */
	queryByIdFn: (id: string) => Promise<TData>;
	/** Query function for fetching by user */
	queryByUserFn: (userId: string) => Promise<TData[]>;
	/** Create mutation function */
	createFn: (data: TCreateData) => Promise<TData>;
	/** Update mutation function */
	updateFn: (id: string, data: TUpdateData) => Promise<TData>;
	/** Delete mutation function */
	deleteFn: (id: string) => Promise<void>;
	/** Custom cache configuration */
	cacheOverrides?: {
		staleTime?: number;
		gcTime?: number;
		refetchInterval?: number | false;
		retry?: boolean | number;
		retryDelay?: number;
	};
	/** Custom error handling */
	errorConfig?: {
		retry?: boolean | number;
		retryDelay?: number;
		onError?: (error: AppError) => void;
		fallback?: any;
	};
	/** Optimistic update configuration */
	optimisticConfig?: {
		enabled?: boolean;
		generateTempId?: () => string;
		onCreateSuccess?: (data: TData) => void;
		onUpdateSuccess?: (data: TData) => void;
		onDeleteSuccess?: (id: string) => void;
	};
}

/**
 * Generic CRUD hooks interface
 */
export interface UseGenericCRUD<TData, TCreateData, TUpdateData> {
	// Query hooks
	useList: (options?: { enabled?: boolean }) => UseGenericQueryResult<
		TData[],
		TData[]
	>;
	useById: (
		id: string,
		options?: { enabled?: boolean },
	) => UseGenericQueryResult<TData, TData>;
	useByUser: (
		userId: string,
		options?: { enabled?: boolean },
	) => UseGenericQueryResult<TData[], TData[]>;

	// Mutation hooks
	useCreate: () => {
		mutate: (data: TCreateData) => void;
		mutateAsync: (data: TCreateData) => Promise<TData>;
		isPending: boolean;
		error: AppError | null;
		reset: () => void;
	};

	useUpdate: () => {
		mutate: (variables: { id: string; data: TUpdateData }) => void;
		mutateAsync: (variables: {
			id: string;
			data: TUpdateData;
		}) => Promise<TData>;
		isPending: boolean;
		error: AppError | null;
		reset: () => void;
	};

	useDelete: () => {
		mutate: (id: string) => void;
		mutateAsync: (id: string) => Promise<void>;
		isPending: boolean;
		error: AppError | null;
		reset: () => void;
	};

	// Utility functions
	invalidateAll: () => Promise<void>;
	invalidateList: () => Promise<void>;
	invalidateById: (id: string) => Promise<void>;
	invalidateByUser: (userId: string) => Promise<void>;
}

/**
 * Invalidation manager for coordinated cache updates
 */
class InvalidationManager {
	constructor(
		private queryKeys: QueryKeyFactory,
		private queryClient: ReturnType<typeof useQueryClient>,
	) {}

	async invalidateAll(): Promise<void> {
		await this.queryClient.invalidateQueries({
			queryKey: this.queryKeys.all(),
		});
	}

	async invalidateList(): Promise<void> {
		await this.queryClient.invalidateQueries({
			queryKey: this.queryKeys.lists(),
		});
	}

	async invalidateById(id: string): Promise<void> {
		await this.queryClient.invalidateQueries({
			queryKey: this.queryKeys.byId(id),
		});
	}

	async invalidateByUser(userId: string): Promise<void> {
		await this.queryClient.invalidateQueries({
			queryKey: this.queryKeys.byUser(userId),
		});
	}

	addToList<T>(item: T): void {
		this.queryClient.setQueriesData(
			{ queryKey: this.queryKeys.lists() },
			(old: T[] | undefined) => [...(old || []), item],
		);
	}

	updateInList<T>(id: string, updater: (item: T) => T): void {
		this.queryClient.setQueriesData(
			{ queryKey: this.queryKeys.lists() },
			(old: T[] | undefined) =>
				old?.map((item) => ((item as any).id === id ? updater(item) : item)),
		);
	}

	removeFromList<T>(predicate: (item: T) => boolean): void {
		this.queryClient.setQueriesData(
			{ queryKey: this.queryKeys.lists() },
			(old: T[] | undefined) => old?.filter(predicate),
		);
	}

	updateByIdData<T>(id: string, updater: (old: T | undefined) => T): void {
		this.queryClient.setQueryData(this.queryKeys.byId(id), updater);
	}
}

/**
 * Generic CRUD hook factory
 */
export function useGenericCRUD<
	TData extends { id: string },
	TCreateData,
	TUpdateData,
>(
	config: CRUDConfig<TData, TCreateData, TUpdateData>,
): UseGenericCRUD<TData, TCreateData, TUpdateData> {
	const queryClient = useQueryClient();
	const invalidationManager = new InvalidationManager(
		config.queryKeys,
		queryClient,
	);

	// Query hooks
	const useList = useCallback(
		(options?: { enabled?: boolean }) => {
			return useGenericQuery<TData[], TData[]>({
				queryKey: config.queryKeys.lists(),
				queryFn: config.queryFn,
				entityName: config.entityName,
				operationName: "list",
				cacheOverrides: config.cacheOverrides,
				errorConfig: config.errorConfig,
				additionalOptions: options,
			});
		},
		[config],
	);

	const useById = useCallback(
		(id: string, options?: { enabled?: boolean }) => {
			return useGenericQuery<TData, TData>({
				queryKey: config.queryKeys.byId(id),
				queryFn: () => config.queryByIdFn(id),
				entityName: config.entityName,
				operationName: "byId",
				cacheOverrides: config.cacheOverrides,
				errorConfig: config.errorConfig,
				additionalOptions: {
					...options,
					enabled: !!id && options?.enabled !== false,
				},
			});
		},
		[config],
	);

	const useByUser = useCallback(
		(userId: string, options?: { enabled?: boolean }) => {
			return useGenericQuery<TData[], TData[]>({
				queryKey: config.queryKeys.byUser(userId),
				queryFn: () => config.queryByUserFn(userId),
				entityName: config.entityName,
				operationName: "byUser",
				cacheOverrides: config.cacheOverrides,
				errorConfig: config.errorConfig,
				additionalOptions: {
					...options,
					enabled: !!userId && options?.enabled !== false,
				},
			});
		},
		[config],
	);

	// Create mutation hook
	const useCreate = useCallback(() => {
		const mutation = useMutation({
			mutationFn: config.createFn,
			onSuccess: (data) => {
				invalidationManager.addToList(data);
				config.optimisticConfig?.onCreateSuccess?.(data);
				invalidationManager.invalidateList();
			},
			onError: (error) => {
				const appError = ErrorHandler.handleQueryError(
					error,
					config.entityName,
					"create",
				);
				config.errorConfig?.onError?.(appError);
			},
		});

		return {
			mutate: mutation.mutate,
			mutateAsync: mutation.mutateAsync,
			isPending: mutation.isPending,
			error: mutation.error
				? ErrorHandler.handleQueryError(
						mutation.error,
						config.entityName,
						"create",
					)
				: null,
			reset: mutation.reset,
		};
	}, [config, invalidationManager]);

	// Update mutation hook
	const useUpdate = useCallback(() => {
		const mutation = useMutation({
			mutationFn: ({ id, data }: { id: string; data: TUpdateData }) =>
				config.updateFn(id, data),
			onSuccess: (data, variables) => {
				invalidationManager.updateInList(variables.id, () => data);
				invalidationManager.updateByIdData(variables.id, () => data);
				config.optimisticConfig?.onUpdateSuccess?.(data);
				invalidationManager.invalidateById(variables.id);
				invalidationManager.invalidateList();
			},
			onError: (error) => {
				const appError = ErrorHandler.handleQueryError(
					error,
					config.entityName,
					"update",
				);
				config.errorConfig?.onError?.(appError);
			},
		});

		return {
			mutate: mutation.mutate,
			mutateAsync: mutation.mutateAsync,
			isPending: mutation.isPending,
			error: mutation.error
				? ErrorHandler.handleQueryError(
						mutation.error,
						config.entityName,
						"update",
					)
				: null,
			reset: mutation.reset,
		};
	}, [config, invalidationManager]);

	// Delete mutation hook
	const useDelete = useCallback(() => {
		const mutation = useMutation({
			mutationFn: config.deleteFn,
			onSuccess: (_, id) => {
				invalidationManager.removeFromList((item: TData) => item.id !== id);
				queryClient.removeQueries({
					queryKey: config.queryKeys.byId(id as string),
				});
				config.optimisticConfig?.onDeleteSuccess?.(id as string);
				invalidationManager.invalidateList();
			},
			onError: (error) => {
				const appError = ErrorHandler.handleQueryError(
					error,
					config.entityName,
					"delete",
				);
				config.errorConfig?.onError?.(appError);
			},
		});

		return {
			mutate: mutation.mutate,
			mutateAsync: mutation.mutateAsync,
			isPending: mutation.isPending,
			error: mutation.error
				? ErrorHandler.handleQueryError(
						mutation.error,
						config.entityName,
						"delete",
					)
				: null,
			reset: mutation.reset,
		};
	}, [config, queryClient, invalidationManager]);

	// Utility functions
	const utilityFunctions = {
		invalidateAll: useCallback(
			() => invalidationManager.invalidateAll(),
			[invalidationManager],
		),
		invalidateList: useCallback(
			() => invalidationManager.invalidateList(),
			[invalidationManager],
		),
		invalidateById: useCallback(
			(id: string) => invalidationManager.invalidateById(id),
			[invalidationManager],
		),
		invalidateByUser: useCallback(
			(userId: string) => invalidationManager.invalidateByUser(userId),
			[invalidationManager],
		),
	};

	return {
		useList,
		useById,
		useByUser,
		useCreate,
		useUpdate,
		useDelete,
		...utilityFunctions,
	};
}

/**
 * Default export
 */
export default useGenericCRUD;
