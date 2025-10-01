/**
 * Unified Marketplace Hook
 *
 * Consolidates marketplace listings management into a single, cohesive API
 * following the new entity architecture with optimistic updates and caching.
 */

import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { MarketplaceListing } from "../../types/database";

// Import new architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import {
	useGenericListQuery,
	useGenericDetailQuery,
	useGenericUserQuery,
} from "../core/useGenericQuery";
import {
	useCreateMutation,
	useUpdateMutation,
	useDeleteMutation,
} from "../core/useMutationHooks";
import { marketplaceSelectors } from "../utils/selectors";

// Query functions (previously in queryFunctions.ts)
export const marketplaceQueries = {
	getListings: async () => {
		const { data, error } = await supabase
			.from("marketplace_listings")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getUserListings: async (userId: string) => {
		const { data, error } = await supabase
			.from("marketplace_listings")
			.select("*")
			.eq("profile_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getActiveListings: async () => {
		const { data, error } = await supabase
			.from("marketplace_listings")
			.select("*")
			.eq("is_active", true)
			.eq("status", "active")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},
};

/**
 * Marketplace query keys using the new unified system
 */
const marketplaceQueryKeys = new EntityQueryKeys("marketplace");

/**
 * Fetch all marketplace listings
 */
async function fetchListings(): Promise<MarketplaceListing[]> {
	return marketplaceQueries.getListings();
}

/**
 * Fetch marketplace listing by ID
 */
async function fetchListingById(
	id: string,
): Promise<MarketplaceListing | null> {
	if (!id) return null;

	const { data, error } = await supabase
		.from("marketplace_listings")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw error;
	}
	return data;
}

/**
 * Fetch user marketplace listings
 */
async function fetchUserListings(
	userId: string,
): Promise<MarketplaceListing[]> {
	if (!userId) return [];

	const { data, error } = await supabase
		.from("marketplace_listings")
		.select("*")
		.eq("profile_id", userId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Hook for all marketplace listings
 */
export function useMarketplaceListings() {
	return useGenericListQuery<MarketplaceListing>({
		queryKey: marketplaceQueryKeys,
		queryFn: fetchListings,
		entityName: "marketplace",
		operationName: "fetchAll",
	});
}

/**
 * Hook for active marketplace listings only
 */
export function useMarketplaceActiveListings() {
	return useGenericListQuery<MarketplaceListing>({
		queryKey: marketplaceQueryKeys,
		queryFn: fetchListings,
		entityName: "marketplace",
		operationName: "fetchActive",
		selector: (data: MarketplaceListing[]) =>
			marketplaceSelectors.activeOnly(data),
	});
}

/**
 * Hook for marketplace listing by ID
 */
export function useMarketplaceListing(id: string) {
	return useGenericDetailQuery<MarketplaceListing | null>({
		queryKey: marketplaceQueryKeys,
		id,
		queryFn: () => fetchListingById(id),
		entityName: "marketplace",
		operationName: "fetchById",
	});
}

/**
 * Hook for user marketplace listings
 */
export function useMarketplaceUserListings(userId: string) {
	return useGenericUserQuery<MarketplaceListing>({
		queryKey: marketplaceQueryKeys,
		userId,
		queryFn: () => fetchUserListings(userId),
		entityName: "marketplace",
		operationName: "fetchByUser",
	});
}

/**
 * Hook for marketplace mutations
 */
export function useMarketplaceMutations() {
	const queryClient = useQueryClient();

	// Create listing mutation
	const createMutation = useCreateMutation(
		async (
			listingData: Omit<MarketplaceListing, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("marketplace_listings")
				.insert([listingData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: marketplaceQueryKeys,
			entityName: "marketplace",
			operationName: "create",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: tempId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
		},
	);

	// Update listing mutation
	const updateMutation = useUpdateMutation(
		async (id: string, data: Partial<MarketplaceListing>) => {
			const { data: updatedListing, error } = await supabase
				.from("marketplace_listings")
				.update({ ...data, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedListing;
		},
		{
			queryKeys: marketplaceQueryKeys,
			entityName: "marketplace",
			operationName: "update",
			optimistic: true,
		},
	);

	// Delete listing mutation
	const deleteMutation = useDeleteMutation(
		async (id: string) => {
			const { error } = await supabase
				.from("marketplace_listings")
				.delete()
				.eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: marketplaceQueryKeys,
			entityName: "marketplace",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage: "Are you sure you want to delete this listing?",
		},
	);

	// Invalidate marketplace cache
	const invalidateMarketplace = () => {
		queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all() });
	};

	return {
		createListing: createMutation.mutate,
		updateListing: updateMutation.mutate,
		deleteListing: deleteMutation.mutate,
		invalidateMarketplace,

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
}

/**
 * Export query keys for external use
 */
export { marketplaceQueryKeys };

/**
 * Default export - unified marketplace hook with options
 */
export default function useMarketplace(options?: {
	mode?: "all" | "active" | "user" | "detail";
	userId?: string;
	listingId?: string;
}) {
	const { mode = "all", userId, listingId } = options || {};

	switch (mode) {
		case "all":
			return useMarketplaceListings();
		case "active":
			return useMarketplaceActiveListings();
		case "user":
			if (!userId) {
				throw new Error("userId required for user mode");
			}
			return useMarketplaceUserListings(userId);
		case "detail":
			if (!listingId) {
				throw new Error("listingId required for detail mode");
			}
			return useMarketplaceListing(listingId);
		default:
			return useMarketplaceListings();
	}
}
