/**
 * Unified Services Hook
 *
 * Provides a unified API for all service operations including queries,
 * mutations, and utilities. Migrated from useServicesRefactored.ts
 * and integrated with servicesQueries from queryFunctions.ts.
 */

import type { Service } from "../../types/database";

// Import new architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { useGenericQuery } from "../core/useGenericQuery";
import { useCustomMutation } from "../core/useMutationHooks";
import { supabase } from "../../lib/supabase";

// Query functions (previously in queryFunctions.ts)
export const servicesQueries = {
	getAll: async () => {
		const { data, error } = await supabase
			.from("services")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getByUser: async (userId: string) => {
		const { data, error } = await supabase
			.from("services")
			.select("*")
			.eq("profile_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},
};

/**
 * Service query keys using the new unified system
 */
const serviceQueryKeys = new EntityQueryKeys("services");

/**
 * Service mutations result type
 */
export interface ServiceMutationsResult {
	createService: (
		serviceData: Omit<Service, "id" | "created_at" | "updated_at">,
	) => void;
	updateService: (params: { id: string; data: Partial<Service> }) => void;
	deleteService: (id: string) => void;

	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;

	createError: any;
	updateError: any;
	deleteError: any;

	reset: () => void;
}

/**
 * Unified services hook result type
 */
export interface UseServicesResult {
	// All services
	all: {
		services: Service[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// User services
	byUser: (userId: string) => {
		services: Service[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// Mutations
	mutations: ServiceMutationsResult;
}

/**
 * Unified services hook
 *
 * Provides multiple query modes and mutations for service operations.
 */
export function useServices(): UseServicesResult {
	// All services query
	const allServicesQuery = useGenericQuery<Service[]>({
		queryKey: serviceQueryKeys,
		queryFn: servicesQueries.getAll,
		entityName: "services",
		operationName: "fetchAll",
	});

	// User services query factory
	const createUserServicesQuery = (userId: string) =>
		useGenericQuery<Service[]>({
			queryKey: serviceQueryKeys,
			queryFn: () => servicesQueries.getByUser(userId),
			entityName: "services",
			operationName: "fetchByUser",
			additionalOptions: {
				enabled: !!userId,
			},
		});

	// Create service mutation
	const createMutation = useCustomMutation(
		async (serviceData: Omit<Service, "id" | "created_at" | "updated_at">) => {
			// Use supabase directly for create since queryFunctions doesn't have create
			const { supabase } = await import("../../lib/supabase");
			const { data, error } = await supabase
				.from("user_services")
				.insert([serviceData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: serviceQueryKeys,
			entityName: "service",
			operationName: "create",
		},
	);

	// Update service mutation
	const updateMutation = useCustomMutation(
		async ({ id, data }: { id: string; data: Partial<Service> }) => {
			// Use supabase directly for update since queryFunctions doesn't have update
			const { supabase } = await import("../../lib/supabase");
			const { data: updatedService, error } = await supabase
				.from("user_services")
				.update({ ...data, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedService;
		},
		{
			queryKeys: serviceQueryKeys,
			entityName: "service",
			operationName: "update",
		},
	);

	// Delete service mutation (soft delete)
	const deleteMutation = useCustomMutation(
		async (id: string) => {
			// Use supabase directly for delete since queryFunctions doesn't have delete
			const { supabase } = await import("../../lib/supabase");
			const { error } = await supabase
				.from("user_services")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: serviceQueryKeys,
			entityName: "service",
			operationName: "delete",
		},
	);

	// Mutations result
	const mutations: ServiceMutationsResult = {
		createService: createMutation.mutate,
		updateService: updateMutation.mutate,
		deleteService: deleteMutation.mutate,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,

		reset: () => {
			createMutation.reset();
			updateMutation.reset();
			deleteMutation.reset();
		},
	};

	return {
		all: {
			services: allServicesQuery.data || [],
			loading: allServicesQuery.isLoading,
			error: allServicesQuery.error,
			refetch: allServicesQuery.refetch,
		},

		byUser: (userId: string) => {
			const userQuery = createUserServicesQuery(userId);
			return {
				services: userQuery.data || [],
				loading: userQuery.isLoading,
				error: userQuery.error,
				refetch: userQuery.refetch,
			};
		},

		mutations,
	};
}

/**
 * Export query keys for external use
 */
export { serviceQueryKeys };
