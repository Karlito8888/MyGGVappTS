import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessesQueries } from "../lib/queryFunctions";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import type { BusinessInside, BusinessOutside } from "../types/database";

export function useBusinessesInside() {
	return useQuery({
		queryKey: queryKeys.businesses.inside(),
		queryFn: ({ signal }) => businessesQueries.getInside(signal),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useBusinessesOutside() {
	return useQuery({
		queryKey: queryKeys.businesses.outside(),
		queryFn: ({ signal }) => businessesQueries.getOutside(signal),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useUserBusinessesInside(userId: string) {
	return useQuery({
		queryKey: queryKeys.businesses.userInside(userId),
		queryFn: ({ signal }) => businessesQueries.getUserInside(userId, signal),
		enabled: !!userId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useUserBusinessesOutside(userId: string) {
	return useQuery({
		queryKey: queryKeys.businesses.userOutside(userId),
		queryFn: ({ signal }) => businessesQueries.getUserOutside(userId, signal),
		enabled: !!userId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useAllBusinesses() {
	const insideQuery = useBusinessesInside();
	const outsideQuery = useBusinessesOutside();

	return {
		insideBusinesses: insideQuery.data || [],
		outsideBusinesses: outsideQuery.data || [],
		isLoading: insideQuery.isLoading || outsideQuery.isLoading,
		error: insideQuery.error || outsideQuery.error,
	};
}

export function useUserAllBusinesses(userId: string) {
	const insideQuery = useUserBusinessesInside(userId);
	const outsideQuery = useUserBusinessesOutside(userId);

	return {
		insideBusinesses: insideQuery.data || [],
		outsideBusinesses: outsideQuery.data || [],
		isLoading: insideQuery.isLoading || outsideQuery.isLoading,
		error: insideQuery.error || outsideQuery.error,
	};
}

export function useInvalidateBusinesses() {
	const queryClient = useQueryClient();

	return {
		invalidateAll: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all }),
		invalidateInside: () =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.inside(),
			}),
		invalidateOutside: () =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.outside(),
			}),
		invalidateUser: (userId: string) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.userInside(userId),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.userOutside(userId),
			});
		},
	};
}

export function useCreateBusinessInside() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newBusiness: Omit<BusinessInside, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("user_business_inside")
				.insert([newBusiness])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.inside(),
			});
		},
	});
}

export function useUpdateBusinessInside() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<BusinessInside> & { id: string }) => {
			const { data, error } = await supabase
				.from("user_business_inside")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.inside(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.userInside(data.profile_id),
			});
		},
	});
}

export function useDeleteBusinessInside() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("user_business_inside")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.inside(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.userInside(data.profile_id),
			});
		},
	});
}

export function useCreateBusinessOutside() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newBusiness: Omit<BusinessOutside, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("user_business_outside")
				.insert([newBusiness])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.outside(),
			});
		},
	});
}

export function useUpdateBusinessOutside() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<BusinessOutside> & { id: string }) => {
			const { data, error } = await supabase
				.from("user_business_outside")
				.update({ ...updates, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.outside(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.userOutside(data.profile_id),
			});
		},
	});
}

export function useDeleteBusinessOutside() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("user_business_outside")
				.update({ is_active: false, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.outside(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.businesses.userOutside(data.profile_id),
			});
		},
	});
}
