import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesQueries } from "../lib/queryFunctions";
import { queryKeys } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import type { MessagesHeader } from "../types/database";

export function useMessagesHeaders() {
	return useQuery({
		queryKey: queryKeys.messages.headers(),
		queryFn: messagesQueries.getHeaders,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
}

export function useActiveMessagesHeaders() {
	return useQuery({
		queryKey: queryKeys.messages.active(),
		queryFn: messagesQueries.getActiveHeaders,
		staleTime: 1000 * 60 * 1, // 1 minute for active messages
		refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
	});
}

export function useUserMessagesHeaders(userId: string) {
	return useQuery({
		queryKey: queryKeys.messages.byUser(userId),
		queryFn: () => messagesQueries.getUserHeaders(userId),
		staleTime: 1000 * 60 * 2, // 2 minutes
		enabled: !!userId,
	});
}

export function useCreateMessageHeader() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newHeader: Omit<MessagesHeader, "id" | "created_at" | "updated_at">,
		) => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const headerWithUser = {
				...newHeader,
				user_id: user?.id,
			};

			return messagesQueries.createHeader(headerWithUser);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.headers() });
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.active() });
			if (data.user_id) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.messages.byUser(data.user_id),
				});
			}
		},
	});
}

export function useUpdateMessageHeader() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<MessagesHeader> & { id: string }) => {
			return messagesQueries.updateHeader(id, updates);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.headers() });
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.active() });
			if (data.user_id) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.messages.byUser(data.user_id),
				});
			}
		},
	});
}

export function useDeleteMessageHeader() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			await messagesQueries.deleteHeader(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.headers() });
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.active() });
			// Note: We don't know the user_id after deletion, so we invalidate all user queries
			queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
		},
	});
}
