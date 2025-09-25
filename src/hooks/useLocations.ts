import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const locationKeys = {
	all: ["locations"] as const,
	lists: () => [...locationKeys.all, "list"] as const,
	list: (filters: string) => [...locationKeys.lists(), { filters }] as const,
	details: () => [...locationKeys.all, "detail"] as const,
	detail: (id: string) => [...locationKeys.details(), id] as const,
	byUser: (userId: string) => [...locationKeys.all, "user", userId] as const,
};

export function useLocations() {
	return useQuery({
		queryKey: locationKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("locations")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useLocation(id: string) {
	return useQuery({
		queryKey: locationKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("locations")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useUserLocations(userId: string) {
	return useQuery({
		queryKey: locationKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.select(`
					*,
					location:locations(*)
				`)
				.eq("profile_id", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function useAssociatedLocationsWithCoords() {
	return useQuery({
		queryKey: [...locationKeys.lists(), "with-coords"],
		queryFn: async () => {
			const { data, error } = await supabase.rpc(
				"get_associated_locations_with_coords",
			);

			if (error) throw error;
			return data;
		},
	});
}

export function useUserLocationIds(userId: string) {
	return useQuery({
		queryKey: [...locationKeys.byUser(userId), "ids"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.select("location_id")
				.eq("profile_id", userId)
				.eq("is_verified", true);

			if (error) throw error;
			return data?.map((item) => item.location_id) || [];
		},
		enabled: !!userId,
	});
}
