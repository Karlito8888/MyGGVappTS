/**
 * Unified Businesses Hook
 *
 * Provides a unified API for all business operations including queries,
 * mutations, and utilities. Consolidates inside/outside businesses into
 * a single API. Migrated from useBusinessesRefactored.ts and integrated
 * with businessesQueries from queryFunctions.ts.
 */

import type { BusinessInside, BusinessOutside } from "../../types/database";

// Import new architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { useGenericQuery } from "../core/useGenericQuery";
import { useCustomMutation } from "../core/useMutationHooks";
import { supabase } from "../../lib/supabase";

// Query functions (previously in queryFunctions.ts)
export const businessesQueries = {
	getInside: async () => {
		const { data, error } = await supabase
			.from("businesses_inside")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getOutside: async () => {
		const { data, error } = await supabase
			.from("businesses_outside")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getUserInside: async (userId: string) => {
		const { data, error } = await supabase
			.from("businesses_inside")
			.select("*")
			.eq("profile_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getUserOutside: async (userId: string) => {
		const { data, error } = await supabase
			.from("businesses_outside")
			.select("*")
			.eq("profile_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},
};

/**
 * Business query keys using the new unified system
 */
const businessInsideQueryKeys = new EntityQueryKeys("businesses_inside");
const businessOutsideQueryKeys = new EntityQueryKeys("businesses_outside");

/**
 * Business mutations result type
 */
export interface BusinessMutationsResult {
	createInsideBusiness: (
		businessData: Omit<BusinessInside, "id" | "created_at" | "updated_at">,
	) => void;
	createOutsideBusiness: (
		businessData: Omit<BusinessOutside, "id" | "created_at" | "updated_at">,
	) => void;
	updateInsideBusiness: (params: {
		id: string;
		data: Partial<BusinessInside>;
	}) => void;
	updateOutsideBusiness: (params: {
		id: string;
		data: Partial<BusinessOutside>;
	}) => void;
	deleteInsideBusiness: (id: string) => void;
	deleteOutsideBusiness: (id: string) => void;

	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;

	createError: any;
	updateError: any;
	deleteError: any;

	reset: () => void;
}

/**
 * Business utilities result type
 */
export interface BusinessUtilsResult {
	invalidateInsideBusinesses: () => Promise<void>;
	invalidateOutsideBusinesses: () => Promise<void>;
	invalidateUserInsideBusinesses: (userId: string) => Promise<void>;
	invalidateUserOutsideBusinesses: (userId: string) => Promise<void>;
	refetchInsideBusinesses: () => Promise<void>;
	refetchOutsideBusinesses: () => Promise<void>;
	refetchUserInsideBusinesses: (userId: string) => Promise<void>;
	refetchUserOutsideBusinesses: (userId: string) => Promise<void>;
}

/**
 * Unified businesses hook result type
 */
export interface UseBusinessesResult {
	// All businesses
	all: {
		insideBusinesses: BusinessInside[];
		outsideBusinesses: BusinessOutside[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// Inside businesses only
	inside: {
		businesses: BusinessInside[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// Outside businesses only
	outside: {
		businesses: BusinessOutside[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// User businesses
	byUser: (userId: string) => {
		insideBusinesses: BusinessInside[];
		outsideBusinesses: BusinessOutside[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// User inside businesses only
	byUserInside: (userId: string) => {
		businesses: BusinessInside[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// User outside businesses only
	byUserOutside: (userId: string) => {
		businesses: BusinessOutside[];
		loading: boolean;
		error: any;
		refetch: () => Promise<void>;
	};

	// Mutations
	mutations: BusinessMutationsResult;

	// Utilities
	utils: BusinessUtilsResult;
}

/**
 * Unified businesses hook
 *
 * Provides multiple query modes and mutations for business operations.
 * Consolidates inside and outside businesses into a single, cohesive API.
 */
export function useBusinesses(): UseBusinessesResult {
	// All inside businesses query
	const allInsideQuery = useGenericQuery<BusinessInside[]>({
		queryKey: businessInsideQueryKeys,
		queryFn: businessesQueries.getInside,
		entityName: "businesses_inside",
		operationName: "fetchAll",
	});

	// All outside businesses query
	const allOutsideQuery = useGenericQuery<BusinessOutside[]>({
		queryKey: businessOutsideQueryKeys,
		queryFn: businessesQueries.getOutside,
		entityName: "businesses_outside",
		operationName: "fetchAll",
	});

	// User inside businesses query factory
	const createUserInsideQuery = (userId: string) =>
		useGenericQuery<BusinessInside[]>({
			queryKey: businessInsideQueryKeys,
			queryFn: () => businessesQueries.getUserInside(userId),
			entityName: "businesses_inside",
			operationName: "fetchByUser",
			additionalOptions: {
				enabled: !!userId,
			},
		});

	// User outside businesses query factory
	const createUserOutsideQuery = (userId: string) =>
		useGenericQuery<BusinessOutside[]>({
			queryKey: businessOutsideQueryKeys,
			queryFn: () => businessesQueries.getUserOutside(userId),
			entityName: "businesses_outside",
			operationName: "fetchByUser",
			additionalOptions: {
				enabled: !!userId,
			},
		});

	// Create inside business mutation
	const createInsideMutation = useCustomMutation(
		async (
			businessData: Omit<BusinessInside, "id" | "created_at" | "updated_at">,
		) => {
			// Use supabase directly for create since queryFunctions doesn't have create
			const { supabase } = await import("../../lib/supabase");
			const { data, error } = await supabase
				.from("user_business_inside")
				.insert([businessData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: businessInsideQueryKeys,
			entityName: "business_inside",
			operationName: "create",
		},
	);

	// Create outside business mutation
	const createOutsideMutation = useCustomMutation(
		async (
			businessData: Omit<BusinessOutside, "id" | "created_at" | "updated_at">,
		) => {
			// Use supabase directly for create since queryFunctions doesn't have create
			const { supabase } = await import("../../lib/supabase");
			const { data, error } = await supabase
				.from("user_business_outside")
				.insert([businessData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: businessOutsideQueryKeys,
			entityName: "business_outside",
			operationName: "create",
		},
	);

	// Update inside business mutation
	const updateInsideMutation = useCustomMutation(
		async ({ id, data }: { id: string; data: Partial<BusinessInside> }) => {
			// Use supabase directly for update since queryFunctions doesn't have update
			const { supabase } = await import("../../lib/supabase");
			const { data: updatedBusiness, error } = await supabase
				.from("user_business_inside")
				.update({ ...data, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedBusiness;
		},
		{
			queryKeys: businessInsideQueryKeys,
			entityName: "business_inside",
			operationName: "update",
		},
	);

	// Update outside business mutation
	const updateOutsideMutation = useCustomMutation(
		async ({ id, ...updates }: { id: string } & Partial<BusinessOutside>) => {
			// Use supabase directly for update since queryFunctions doesn't have update
			const { supabase } = await import("../../lib/supabase");
			const { data, error } = await supabase
				.from("businesses_outside")
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: businessOutsideQueryKeys,
			entityName: "business_outside",
			operationName: "update",
		},
	);

	// Delete inside business mutation (soft delete)
	const deleteInsideMutation = useCustomMutation(
		async (id: string) => {
			// Use supabase directly for delete since queryFunctions doesn't have delete
			const { supabase } = await import("../../lib/supabase");
			const { error } = await supabase
				.from("user_business_inside")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: businessInsideQueryKeys,
			entityName: "business_inside",
			operationName: "delete",
		},
	);

	// Delete outside business mutation (soft delete)
	const deleteOutsideMutation = useCustomMutation(
		async (id: string) => {
			// Use supabase directly for delete since queryFunctions doesn't have delete
			const { supabase } = await import("../../lib/supabase");
			const { error } = await supabase
				.from("user_business_outside")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: businessOutsideQueryKeys,
			entityName: "business_outside",
			operationName: "delete",
		},
	);

	// Mutations result
	const mutations: BusinessMutationsResult = {
		createInsideBusiness: createInsideMutation.mutate,
		createOutsideBusiness: createOutsideMutation.mutate,
		updateInsideBusiness: updateInsideMutation.mutate,
		updateOutsideBusiness: updateOutsideMutation.mutate,
		deleteInsideBusiness: deleteInsideMutation.mutate,
		deleteOutsideBusiness: deleteOutsideMutation.mutate,

		isCreating:
			createInsideMutation.isPending || createOutsideMutation.isPending,
		isUpdating:
			updateInsideMutation.isPending || updateOutsideMutation.isPending,
		isDeleting:
			deleteInsideMutation.isPending || deleteOutsideMutation.isPending,

		createError: createInsideMutation.error || createOutsideMutation.error,
		updateError: updateInsideMutation.error || updateOutsideMutation.error,
		deleteError: deleteInsideMutation.error || deleteOutsideMutation.error,

		reset: () => {
			createInsideMutation.reset();
			createOutsideMutation.reset();
			updateInsideMutation.reset();
			updateOutsideMutation.reset();
			deleteInsideMutation.reset();
			deleteOutsideMutation.reset();
		},
	};

	// Utilities
	const utils: BusinessUtilsResult = {
		invalidateInsideBusinesses: async () => {
			const { useQueryClient } = await import("@tanstack/react-query");
			const queryClient = useQueryClient();
			await queryClient.invalidateQueries({
				queryKey: businessInsideQueryKeys.all(),
			});
		},

		invalidateOutsideBusinesses: async () => {
			const { useQueryClient } = await import("@tanstack/react-query");
			const queryClient = useQueryClient();
			await queryClient.invalidateQueries({
				queryKey: businessOutsideQueryKeys.all(),
			});
		},

		invalidateUserInsideBusinesses: async (userId: string) => {
			const { useQueryClient } = await import("@tanstack/react-query");
			const queryClient = useQueryClient();
			await queryClient.invalidateQueries({
				queryKey: businessInsideQueryKeys.byUser(userId),
			});
		},

		invalidateUserOutsideBusinesses: async (userId: string) => {
			const { useQueryClient } = await import("@tanstack/react-query");
			const queryClient = useQueryClient();
			await queryClient.invalidateQueries({
				queryKey: businessOutsideQueryKeys.byUser(userId),
			});
		},

		refetchInsideBusinesses: async () => {
			await allInsideQuery.refetch();
		},

		refetchOutsideBusinesses: async () => {
			await allOutsideQuery.refetch();
		},

		refetchUserInsideBusinesses: async (userId: string) => {
			const userQuery = createUserInsideQuery(userId);
			await userQuery.refetch();
		},

		refetchUserOutsideBusinesses: async (userId: string) => {
			const userQuery = createUserOutsideQuery(userId);
			await userQuery.refetch();
		},
	};

	return {
		all: {
			insideBusinesses: allInsideQuery.data || [],
			outsideBusinesses: allOutsideQuery.data || [],
			loading: allInsideQuery.isLoading || allOutsideQuery.isLoading,
			error: allInsideQuery.error || allOutsideQuery.error,
			refetch: async () => {
				await allInsideQuery.refetch();
				await allOutsideQuery.refetch();
			},
		},

		inside: {
			businesses: allInsideQuery.data || [],
			loading: allInsideQuery.isLoading,
			error: allInsideQuery.error,
			refetch: allInsideQuery.refetch,
		},

		outside: {
			businesses: allOutsideQuery.data || [],
			loading: allOutsideQuery.isLoading,
			error: allOutsideQuery.error,
			refetch: allOutsideQuery.refetch,
		},

		byUser: (userId: string) => {
			const userInsideQuery = createUserInsideQuery(userId);
			const userOutsideQuery = createUserOutsideQuery(userId);
			return {
				insideBusinesses: userInsideQuery.data || [],
				outsideBusinesses: userOutsideQuery.data || [],
				loading: userInsideQuery.isLoading || userOutsideQuery.isLoading,
				error: userInsideQuery.error || userOutsideQuery.error,
				refetch: async () => {
					await userInsideQuery.refetch();
					await userOutsideQuery.refetch();
				},
			};
		},

		byUserInside: (userId: string) => {
			const userQuery = createUserInsideQuery(userId);
			return {
				businesses: userQuery.data || [],
				loading: userQuery.isLoading,
				error: userQuery.error,
				refetch: userQuery.refetch,
			};
		},

		byUserOutside: (userId: string) => {
			const userQuery = createUserOutsideQuery(userId);
			return {
				businesses: userQuery.data || [],
				loading: userQuery.isLoading,
				error: userQuery.error,
				refetch: userQuery.refetch,
			};
		},

		mutations,
		utils,
	};
}

/**
 * Export query keys for external use
 */
export { businessInsideQueryKeys, businessOutsideQueryKeys };
