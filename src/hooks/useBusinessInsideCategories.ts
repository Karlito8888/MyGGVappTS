import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { BusinessInsideCategory } from "../types/database";

export const businessInsideCategoryKeys = {
	all: ["business-inside-categories"] as const,
	lists: () => [...businessInsideCategoryKeys.all, "list"] as const,
	list: (filters: string) =>
		[...businessInsideCategoryKeys.lists(), { filters }] as const,
	details: () => [...businessInsideCategoryKeys.all, "detail"] as const,
	detail: (id: string) =>
		[...businessInsideCategoryKeys.details(), id] as const,
};

export function useBusinessInsideCategories() {
	return useQuery({
		queryKey: businessInsideCategoryKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("business_inside_categories")
				.select("*")
				.eq("is_active", true)
				.order("name", { ascending: true });

			if (error) throw error;
			return data;
		},
	});
}

export function useBusinessInsideCategory(id: string) {
	return useQuery({
		queryKey: businessInsideCategoryKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("business_inside_categories")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useCreateBusinessInsideCategory() {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: async (
			newCategory: Omit<
				BusinessInsideCategory,
				"id" | "created_at" | "updated_at"
			>,
		) => {
			if (!user) {
				throw new Error("Authentication required to create categories");
			}

			const { data, error } = await supabase
				.from("business_inside_categories")
				.insert([newCategory])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: businessInsideCategoryKeys.lists(),
			});
		},
	});
}

export function useUpdateBusinessInsideCategory() {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<BusinessInsideCategory> & { id: string }) => {
			if (!user) {
				throw new Error("Authentication required to update categories");
			}

			const { data, error } = await supabase
				.from("business_inside_categories")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: businessInsideCategoryKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: businessInsideCategoryKeys.detail(data.id),
			});
		},
	});
}

export function useDeleteBusinessInsideCategory() {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: async (id: string) => {
			if (!user) {
				throw new Error("Authentication required to delete categories");
			}

			const { data, error } = await supabase
				.from("business_inside_categories")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: businessInsideCategoryKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: businessInsideCategoryKeys.detail(data.id),
			});
		},
	});
}
