import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ConversationCleanupNotification } from "../types/database";

export const conversationCleanupNotificationKeys = {
	all: ["conversation-cleanup-notifications"] as const,
	lists: () => [...conversationCleanupNotificationKeys.all, "list"] as const,
	list: (filters: string) =>
		[...conversationCleanupNotificationKeys.lists(), { filters }] as const,
	details: () =>
		[...conversationCleanupNotificationKeys.all, "detail"] as const,
	detail: (id: string) =>
		[...conversationCleanupNotificationKeys.details(), id] as const,
	byUser: (userId: string) =>
		[...conversationCleanupNotificationKeys.all, "user", userId] as const,
	unacknowledged: (userId: string) =>
		[
			...conversationCleanupNotificationKeys.all,
			"user",
			userId,
			"unacknowledged",
		] as const,
};

export function useConversationCleanupNotifications() {
	return useQuery({
		queryKey: conversationCleanupNotificationKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useConversationCleanupNotification(id: string) {
	return useQuery({
		queryKey: conversationCleanupNotificationKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useConversationCleanupNotificationsByUser(userId: string) {
	return useQuery({
		queryKey: conversationCleanupNotificationKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function useUnacknowledgedCleanupNotifications(userId: string) {
	return useQuery({
		queryKey: conversationCleanupNotificationKeys.unacknowledged(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.select("*")
				.eq("user_id", userId)
				.eq("is_acknowledged", false)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

// RLS: INSERT restricted to admins only (auth.uid() = user_id with admin check)
export function useCreateConversationCleanupNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newNotification: Omit<
				ConversationCleanupNotification,
				"id" | "created_at"
			>,
		) => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.insert([newNotification])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.byUser(data.user_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.unacknowledged(
					data.user_id,
				),
			});
		},
	});
}

// RLS: UPDATE restricted to own records (auth.uid() = user_id)
export function useUpdateConversationCleanupNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<ConversationCleanupNotification> & { id: string }) => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.byUser(data.user_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.unacknowledged(
					data.user_id,
				),
			});
		},
	});
}

export function useAcknowledgeCleanupNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("conversation_cleanup_notifications")
				.update({ is_acknowledged: true })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.byUser(data.user_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.unacknowledged(
					data.user_id,
				),
			});
		},
	});
}

// RLS: DELETE restricted to own records (auth.uid() = user_id)
export function useDeleteConversationCleanupNotification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from("conversation_cleanup_notifications")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (id) => {
			queryClient.invalidateQueries({
				queryKey: conversationCleanupNotificationKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: conversationCleanupNotificationKeys.detail(id),
			});
		},
	});
}
