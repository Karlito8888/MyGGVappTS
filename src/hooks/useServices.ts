import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesQueries } from "../lib/queryFunctions";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import type { Service } from "../types/database";

export function useServices() {
	return useQuery({
		queryKey: queryKeys.services.lists(),
		queryFn: ({ signal }) => servicesQueries.getAll(signal),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useUserServices(userId: string) {
	return useQuery({
		queryKey: queryKeys.services.user(userId),
		queryFn: ({ signal }) => servicesQueries.getByUser(userId, signal),
		enabled: !!userId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useInvalidateServices() {
	const queryClient = useQueryClient();

	return {
		invalidateAll: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
		invalidateUser: (userId: string) =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.services.user(userId),
			}),
	};
}

export function useCreateService() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newService: Omit<Service, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("user_services")
				.insert([newService])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.services.lists(),
			});
		},
	});
}

export function useUpdateService() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<Service> & { id: string }) => {
			const { data, error } = await supabase
				.from("user_services")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.services.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.services.user(data.profile_id),
			});
		},
	});
}

export function useDeleteService() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("user_services")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.services.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.services.user(data.profile_id),
			});
		},
	});
}
