import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ServiceCategory } from "../types/database";

export const serviceCategoryKeys = {
	all: ["service-categories"] as const,
	lists: () => [...serviceCategoryKeys.all, "list"] as const,
	list: (filters: string) =>
		[...serviceCategoryKeys.lists(), { filters }] as const,
	details: () => [...serviceCategoryKeys.all, "detail"] as const,
	detail: (id: string) => [...serviceCategoryKeys.details(), id] as const,
};

export function useServiceCategories() {
	return useQuery({
		queryKey: serviceCategoryKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("service_categories")
				.select("*")
				.eq("is_active", true)
				.order("name", { ascending: true });

			if (error) throw error;
			return data;
		},
	});
}

export function useServiceCategory(id: string) {
	return useQuery({
		queryKey: serviceCategoryKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("service_categories")
				.select("*")
				.eq("id", id)
				.eq("is_active", true)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useCreateServiceCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newCategory: Omit<ServiceCategory, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("service_categories")
				.insert([newCategory])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.lists() });
		},
	});
}

export function useUpdateServiceCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<ServiceCategory> & { id: string }) => {
			const { data, error } = await supabase
				.from("service_categories")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: serviceCategoryKeys.detail(data.id),
			});
		},
	});
}

export function useDeleteServiceCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("service_categories")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.lists() });
			queryClient.removeQueries({
				queryKey: serviceCategoryKeys.detail(data.id),
			});
		},
	});
}
