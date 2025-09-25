import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { BusinessOutsideCategory } from "../types/database";

export const businessOutsideCategoryKeys = {
	all: ["business-outside-categories"] as const,
	lists: () => [...businessOutsideCategoryKeys.all, "list"] as const,
	list: (filters: string) =>
		[...businessOutsideCategoryKeys.lists(), { filters }] as const,
	details: () => [...businessOutsideCategoryKeys.all, "detail"] as const,
	detail: (id: string) =>
		[...businessOutsideCategoryKeys.details(), id] as const,
};

export function useBusinessOutsideCategories() {
	return useQuery({
		queryKey: businessOutsideCategoryKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("business_outside_categories")
				.select("*")
				.eq("is_active", true)
				.order("name", { ascending: true });

			if (error) throw error;
			return data;
		},
	});
}

export function useBusinessOutsideCategory(id: string) {
	return useQuery({
		queryKey: businessOutsideCategoryKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("business_outside_categories")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useCreateBusinessOutsideCategory() {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: async (
			newCategory: Omit<
				BusinessOutsideCategory,
				"id" | "created_at" | "updated_at"
			>,
		) => {
			if (!user) {
				throw new Error("Authentication required to create categories");
			}

			const { data, error } = await supabase
				.from("business_outside_categories")
				.insert([newCategory])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: businessOutsideCategoryKeys.lists(),
			});
		},
	});
}

export function useUpdateBusinessOutsideCategory() {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<BusinessOutsideCategory> & { id: string }) => {
			if (!user) {
				throw new Error("Authentication required to update categories");
			}

			const { data, error } = await supabase
				.from("business_outside_categories")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: businessOutsideCategoryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: businessOutsideCategoryKeys.detail(data.id),
			});
		},
	});
}

export function useDeleteBusinessOutsideCategory() {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: async (id: string) => {
			if (!user) {
				throw new Error("Authentication required to delete categories");
			}

			const { data, error } = await supabase
				.from("business_outside_categories")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: businessOutsideCategoryKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: businessOutsideCategoryKeys.detail(data.id),
			});
		},
	});
}
