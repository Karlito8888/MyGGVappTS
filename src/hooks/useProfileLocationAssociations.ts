import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ProfileLocationAssociation } from "../types/database";

export const profileLocationAssociationKeys = {
	all: ["profile-location-associations"] as const,
	lists: () => [...profileLocationAssociationKeys.all, "list"] as const,
	list: (filters: string) =>
		[...profileLocationAssociationKeys.lists(), { filters }] as const,
	details: () => [...profileLocationAssociationKeys.all, "detail"] as const,
	detail: (id: number) =>
		[...profileLocationAssociationKeys.details(), id] as const,
	byProfile: (profileId: string) =>
		[...profileLocationAssociationKeys.all, "profile", profileId] as const,
	byLocation: (locationId: string) =>
		[...profileLocationAssociationKeys.all, "location", locationId] as const,
};

export function useProfileLocationAssociations() {
	return useQuery({
		queryKey: profileLocationAssociationKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.select("*")
				.order("id", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useProfileLocationAssociation(id: number) {
	return useQuery({
		queryKey: profileLocationAssociationKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useProfileLocationAssociationsByProfile(profileId: string) {
	return useQuery({
		queryKey: profileLocationAssociationKeys.byProfile(profileId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.select("*")
				.eq("profile_id", profileId)
				.order("id", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!profileId,
	});
}

export function useProfileLocationAssociationsByLocation(locationId: string) {
	return useQuery({
		queryKey: profileLocationAssociationKeys.byLocation(locationId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.select("*")
				.eq("location_id", locationId)
				.order("id", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!locationId,
	});
}

export function useCreateProfileLocationAssociation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newAssociation: Omit<ProfileLocationAssociation, "id">,
		) => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.insert([newAssociation])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.byProfile(data.profile_id),
			});
			if (data.location_id) {
				queryClient.invalidateQueries({
					queryKey: profileLocationAssociationKeys.byLocation(data.location_id),
				});
			}
		},
	});
}

export function useUpdateProfileLocationAssociation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<ProfileLocationAssociation> & { id: number }) => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.byProfile(data.profile_id),
			});
			if (data.location_id) {
				queryClient.invalidateQueries({
					queryKey: profileLocationAssociationKeys.byLocation(data.location_id),
				});
			}
		},
	});
}

export function useDeleteProfileLocationAssociation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			// First, get the association to know which profile and location it belongs to
			const { data: association, error: fetchError } = await supabase
				.from("profile_location_associations")
				.select("profile_id, location_id")
				.eq("id", id)
				.single();

			if (fetchError) throw fetchError;

			// Then delete it (RLS will handle the permission check)
			const { error } = await supabase
				.from("profile_location_associations")
				.delete()
				.eq("id", id);

			if (error) throw error;

			// Return both id and association data for cache invalidation
			return {
				id,
				profileId: association.profile_id,
				locationId: association.location_id,
			};
		},
		onSuccess: ({ id, profileId, locationId }) => {
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: profileLocationAssociationKeys.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: profileLocationAssociationKeys.byProfile(profileId),
			});
			if (locationId) {
				queryClient.invalidateQueries({
					queryKey: profileLocationAssociationKeys.byLocation(locationId),
				});
			}
		},
	});
}
