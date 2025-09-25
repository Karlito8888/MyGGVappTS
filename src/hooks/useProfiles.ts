import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profilesQueries } from "../lib/queryFunctions";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/database";

export function useProfiles() {
	return useQuery({
		queryKey: queryKeys.profiles.lists(),
		queryFn: profilesQueries.getAll,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useProfile(id: string) {
	return useQuery({
		queryKey: queryKeys.profiles.detail(id),
		queryFn: () => profilesQueries.getById(id),
		enabled: !!id,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useCreateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newProfile: Omit<Profile, "id" | "updated_at">) => {
			const { data, error } = await supabase
				.from("profiles")
				.insert([newProfile])
				.select()
				.single();

			if (error) {
				// Handle RLS-specific errors
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only create your own profile",
					);
				}
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.profiles.lists() });
		},
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<Profile> & { id: string }) => {
			const { data, error } = await supabase
				.from("profiles")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				// Handle RLS-specific errors
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only update your own profile",
					);
				}
				throw error;
			}
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.profiles.lists() });
			queryClient.invalidateQueries({
				queryKey: queryKeys.profiles.detail(data.id),
			});
		},
	});
}

export function useDeleteProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase.from("profiles").delete().eq("id", id);

			if (error) {
				// Handle RLS-specific errors
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only delete your own profile",
					);
				}
				throw error;
			}
			return id;
		},
		onSuccess: (id) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.profiles.lists() });
			queryClient.removeQueries({ queryKey: queryKeys.profiles.detail(id) });
		},
	});
}
