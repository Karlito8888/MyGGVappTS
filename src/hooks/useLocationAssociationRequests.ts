import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { LocationAssociationRequest } from "../types/database";

export const locationAssociationRequestKeys = {
	all: ["location-association-requests"] as const,
	lists: () => [...locationAssociationRequestKeys.all, "list"] as const,
	list: (filters: string) =>
		[...locationAssociationRequestKeys.lists(), { filters }] as const,
	details: () => [...locationAssociationRequestKeys.all, "detail"] as const,
	detail: (id: number) =>
		[...locationAssociationRequestKeys.details(), id] as const,
	byRequester: (requesterId: string) =>
		[...locationAssociationRequestKeys.all, "requester", requesterId] as const,
	byApprover: (approverId: string) =>
		[...locationAssociationRequestKeys.all, "approver", approverId] as const,
	byLocation: (locationId: string) =>
		[...locationAssociationRequestKeys.all, "location", locationId] as const,
	byStatus: (status: string) =>
		[...locationAssociationRequestKeys.all, "status", status] as const,
};

export function useLocationAssociationRequests() {
	return useQuery({
		queryKey: locationAssociationRequestKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		// RLS allows SELECT for all users, but we should ensure this is only used by authenticated users
		// in the components that consume this hook
	});
}

export function useLocationAssociationRequest(id: number) {
	return useQuery({
		queryKey: locationAssociationRequestKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useLocationAssociationRequestsByRequester(requesterId: string) {
	return useQuery({
		queryKey: locationAssociationRequestKeys.byRequester(requesterId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.eq("requester_id", requesterId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!requesterId,
	});
}

export function useLocationAssociationRequestsByApprover(approverId: string) {
	return useQuery({
		queryKey: locationAssociationRequestKeys.byApprover(approverId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.eq("approver_id", approverId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!approverId,
	});
}

export function useLocationAssociationRequestsByLocation(locationId: string) {
	return useQuery({
		queryKey: locationAssociationRequestKeys.byLocation(locationId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.eq("location_id", locationId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!locationId,
	});
}

export function useLocationAssociationRequestsByStatus(status: string) {
	return useQuery({
		queryKey: locationAssociationRequestKeys.byStatus(status),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.eq("status", status)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!status,
	});
}

export function useMyLocationAssociationRequests(currentUserId: string) {
	return useQuery({
		queryKey: [
			...locationAssociationRequestKeys.all,
			"my-requests",
			currentUserId,
		],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.select("*")
				.or(`requester_id.eq.${currentUserId},approver_id.eq.${currentUserId}`)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!currentUserId,
	});
}

export function useCreateLocationAssociationRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newRequest: Omit<
				LocationAssociationRequest,
				"id" | "created_at" | "approved_at" | "rejected_at"
			>,
		) => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.insert([newRequest])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byRequester(data.requester_id),
			});
			if (data.approver_id) {
				queryClient.invalidateQueries({
					queryKey: locationAssociationRequestKeys.byApprover(data.approver_id),
				});
			}
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byLocation(data.location_id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus(data.status),
			});
		},
	});
}

export function useUpdateLocationAssociationRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<LocationAssociationRequest> & { id: number }) => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byRequester(data.requester_id),
			});
			if (data.approver_id) {
				queryClient.invalidateQueries({
					queryKey: locationAssociationRequestKeys.byApprover(data.approver_id),
				});
			}
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byLocation(data.location_id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus(data.status),
			});
			// Note: RLS policy ensures users can only update their own requests or if they are the approver
		},
	});
}

export function useApproveLocationAssociationRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.update({
					status: "approved",
					approved_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byRequester(data.requester_id),
			});
			if (data.approver_id) {
				queryClient.invalidateQueries({
					queryKey: locationAssociationRequestKeys.byApprover(data.approver_id),
				});
			}
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byLocation(data.location_id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus("pending"),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus("approved"),
			});
		},
	});
}

export function useRejectLocationAssociationRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.update({
					status: "rejected",
					rejected_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byRequester(data.requester_id),
			});
			if (data.approver_id) {
				queryClient.invalidateQueries({
					queryKey: locationAssociationRequestKeys.byApprover(data.approver_id),
				});
			}
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byLocation(data.location_id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus("pending"),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus("rejected"),
			});
		},
	});
}

export function useDeleteLocationAssociationRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			// First, get the request to know which requester, approver, and location it belongs to
			const { data: request, error: fetchError } = await supabase
				.from("location_association_requests")
				.select("requester_id, approver_id, location_id, status")
				.eq("id", id)
				.single();

			if (fetchError) throw fetchError;

			// Then delete it (RLS will handle the permission check - users can only delete their own requests)
			const { error } = await supabase
				.from("location_association_requests")
				.delete()
				.eq("id", id);

			if (error) throw error;

			// Return both id and request data for cache invalidation
			return {
				id,
				requesterId: request.requester_id,
				approverId: request.approver_id,
				locationId: request.location_id,
				status: request.status,
			};
		},
		onSuccess: ({ id, requesterId, approverId, locationId, status }) => {
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: locationAssociationRequestKeys.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byRequester(requesterId),
			});
			if (approverId) {
				queryClient.invalidateQueries({
					queryKey: locationAssociationRequestKeys.byApprover(approverId),
				});
			}
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byLocation(locationId),
			});
			queryClient.invalidateQueries({
				queryKey: locationAssociationRequestKeys.byStatus(status),
			});
		},
	});
}
