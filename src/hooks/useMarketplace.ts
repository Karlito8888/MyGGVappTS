import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketplaceQueries } from "../lib/queryFunctions";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import type { MarketplaceListing } from "../types/database";

export function useMarketplaceListings() {
	return useQuery({
		queryKey: queryKeys.marketplace.listings(),
		queryFn: ({ signal }) => marketplaceQueries.getListings(signal),
		staleTime: 1000 * 60 * 3, // 3 minutes
	});
}

export function useMyMarketplaceListings(profileId: string) {
	return useQuery({
		queryKey: [...queryKeys.marketplace.all, "my-listings", profileId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("marketplace_listings")
				.select("*")
				.eq("profile_id", profileId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data || [];
		},
		enabled: !!profileId,
	});
}

export function useMarketplaceListing(id: string) {
	return useQuery({
		queryKey: [...queryKeys.marketplace.all, "detail", id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("marketplace_listings")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useUpdateMarketplaceListing() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<MarketplaceListing> & { id: string }) => {
			const { data, error } = await supabase
				.from("marketplace_listings")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.marketplace.listings(),
			});
			queryClient.invalidateQueries({
				queryKey: [...queryKeys.marketplace.all, "detail", data.id],
			});
			queryClient.invalidateQueries({
				queryKey: [
					...queryKeys.marketplace.all,
					"my-listings",
					data.profile_id,
				],
			});
		},
	});
}

export function useDeleteMarketplaceListing() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from("marketplace_listings")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (id) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.marketplace.listings(),
			});
			queryClient.removeQueries({
				queryKey: [...queryKeys.marketplace.all, "detail", id],
			});
		},
	});
}

export function useInvalidateMarketplace() {
	const queryClient = useQueryClient();

	return {
		invalidateAll: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all }),
		invalidateListings: () =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.marketplace.listings(),
			}),
	};
}
