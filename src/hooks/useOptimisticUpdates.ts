import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import type { MarketplaceListing, Profile, Service } from "../types/database";

// Service mutations with optimistic updates
export function useCreateService() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newService: Omit<Service, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("user_services")
				.insert(newService)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onMutate: async (newService) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: queryKeys.services.all });

			// Snapshot previous value
			const previousServices = queryClient.getQueryData(
				queryKeys.services.lists(),
			);
			const previousUserServices = queryClient.getQueryData(
				queryKeys.services.user(newService.profile_id),
			);

			// Optimistically update
			const optimisticService = {
				...newService,
				id: `temp-${Date.now()}`,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			queryClient.setQueryData(
				queryKeys.services.lists(),
				(old: Service[] = []) => [optimisticService, ...old],
			);

			queryClient.setQueryData(
				queryKeys.services.user(newService.profile_id),
				(old: Service[] = []) => [optimisticService, ...old],
			);

			return { previousServices, previousUserServices };
		},
		onError: (_err, newService, context) => {
			// Rollback on error
			if (context?.previousServices) {
				queryClient.setQueryData(
					queryKeys.services.lists(),
					context.previousServices,
				);
			}
			if (context?.previousUserServices) {
				queryClient.setQueryData(
					queryKeys.services.user(newService.profile_id),
					context.previousUserServices,
				);
			}
		},
		onSettled: () => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
		},
	});
}

// Marketplace mutations
export function useCreateMarketplaceListing() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newListing: Omit<MarketplaceListing, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("marketplace_listings")
				.insert(newListing)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onMutate: async (newListing) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.marketplace.all });

			const previousListings = queryClient.getQueryData(
				queryKeys.marketplace.listings(),
			);

			const optimisticListing = {
				...newListing,
				id: `temp-${Date.now()}`,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			queryClient.setQueryData(
				queryKeys.marketplace.listings(),
				(old: MarketplaceListing[] = []) => [optimisticListing, ...old],
			);

			return { previousListings };
		},
		onError: (_err, _newListing, context) => {
			if (context?.previousListings) {
				queryClient.setQueryData(
					queryKeys.marketplace.listings(),
					context.previousListings,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
		},
	});
}

export function useOptimisticUpdateMarketplaceListing() {
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
		onMutate: async ({ id, ...updates }) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.marketplace.all });

			const previousListings = queryClient.getQueryData(
				queryKeys.marketplace.listings(),
			);

			queryClient.setQueryData(
				queryKeys.marketplace.listings(),
				(old: MarketplaceListing[] = []) =>
					old.map((listing) =>
						listing.id === id ? { ...listing, ...updates } : listing,
					),
			);

			return { previousListings };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousListings) {
				queryClient.setQueryData(
					queryKeys.marketplace.listings(),
					context.previousListings,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
		},
	});
}

export function useOptimisticDeleteMarketplaceListing() {
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
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.marketplace.all });

			const previousListings = queryClient.getQueryData(
				queryKeys.marketplace.listings(),
			);

			queryClient.setQueryData(
				queryKeys.marketplace.listings(),
				(old: MarketplaceListing[] = []) =>
					old.filter((listing) => listing.id !== id),
			);

			return { previousListings };
		},
		onError: (_err, _id, context) => {
			if (context?.previousListings) {
				queryClient.setQueryData(
					queryKeys.marketplace.listings(),
					context.previousListings,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
		},
	});
}

// Profile update mutation
export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			updates,
		}: { id: string; updates: Partial<Profile> }) => {
			const { data, error } = await supabase
				.from("profiles")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onMutate: async ({ id, updates }) => {
			await queryClient.cancelQueries({
				queryKey: queryKeys.profiles.detail(id),
			});

			const previousProfile = queryClient.getQueryData(
				queryKeys.profiles.detail(id),
			);

			queryClient.setQueryData(
				queryKeys.profiles.detail(id),
				(old: Profile | undefined) => ({
					...old,
					...updates,
				}),
			);

			return { previousProfile };
		},
		onError: (_err, { id }, context) => {
			if (context?.previousProfile) {
				queryClient.setQueryData(
					queryKeys.profiles.detail(id),
					context.previousProfile,
				);
			}
		},
		onSettled: (_data, _error, { id }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.profiles.detail(id),
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(id) });
		},
	});
}
