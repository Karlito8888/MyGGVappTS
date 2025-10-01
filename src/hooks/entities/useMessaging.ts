/**
 * Unified Messaging Hook
 *
 * Consolidates chats, messages, private messages, and headers
 * into a single, cohesive API following the new entity architecture.
 */

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type {
	Chat,
	PrivateMessage,
	MessagesHeader,
} from "../../types/database";

// Import new architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { useGenericQuery } from "../core/useGenericQuery";
import {
	useCreateMutation,
	useUpdateMutation,
	useDeleteMutation,
	useCustomMutation,
} from "../core/useMutationHooks";

// Query functions (previously in queryFunctions.ts)
const messagesQueries = {
	getHeaders: async () => {
		const { data, error } = await supabase
			.from("messages_headers")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getActiveHeaders: async () => {
		const { data, error } = await supabase
			.from("messages_headers")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getUserHeaders: async (userId: string) => {
		const { data, error } = await supabase
			.from("messages_headers")
			.select("*")
			.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	createHeader: async (headerData: any) => {
		const { data, error } = await supabase
			.from("messages_headers")
			.insert(headerData)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	updateHeader: async (id: string, updates: any) => {
		const { data, error } = await supabase
			.from("messages_headers")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	deleteHeader: async (id: string) => {
		const { error } = await supabase
			.from("messages_headers")
			.delete()
			.eq("id", id);

		if (error) throw error;
	},
};

/**
 * Messaging query keys using the new unified system
 */
const headerQueryKeys = new EntityQueryKeys("headers");
const chatQueryKeys = new EntityQueryKeys("chats");
const messageQueryKeys = new EntityQueryKeys("messages");
const privateMessageQueryKeys = new EntityQueryKeys("private_messages");

/**
 * Fetch all message headers
 */
async function fetchHeaders(): Promise<MessagesHeader[]> {
	return messagesQueries.getHeaders();
}

/**
 * Fetch active message headers
 */
async function fetchActiveHeaders(): Promise<MessagesHeader[]> {
	return messagesQueries.getActiveHeaders();
}

/**
 * Fetch user message headers
 */
async function fetchUserHeaders(userId: string): Promise<MessagesHeader[]> {
	return messagesQueries.getUserHeaders(userId);
}

/**
 * Fetch all chats
 */
async function fetchChats(): Promise<Chat[]> {
	const { data, error } = await supabase
		.from("chat")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch chat by ID
 */
async function fetchChatById(id: string): Promise<Chat | null> {
	if (!id) return null;

	const { data, error } = await supabase
		.from("chat")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw error;
	}
	return data;
}

/**
 * Fetch messages by chat ID
 */
async function fetchMessagesByChat(chatId: string): Promise<PrivateMessage[]> {
	if (!chatId) return [];

	const { data, error } = await supabase
		.from("private_messages")
		.select("*")
		.eq("chat_id", chatId)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch private messages between users
 */
async function fetchPrivateMessagesBetweenUsers(
	userId1: string,
	userId2: string,
): Promise<PrivateMessage[]> {
	if (!userId1 || !userId2) return [];

	const { data, error } = await supabase
		.from("private_messages")
		.select("*")
		.or(
			`(sender_id.eq.${userId1},receiver_id.eq.${userId2}),(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
		)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data || [];
}

/**
 * Hook for all message headers
 */
export function useMessagingHeaders() {
	return useGenericQuery<MessagesHeader[]>({
		queryKey: headerQueryKeys,
		queryFn: fetchHeaders,
		entityName: "headers",
		operationName: "fetchAll",
	});
}

/**
 * Hook for active message headers
 */
export function useMessagingActiveHeaders() {
	return useGenericQuery<MessagesHeader[]>({
		queryKey: headerQueryKeys,
		queryFn: fetchActiveHeaders,
		entityName: "headers",
		operationName: "fetchActive",
	});
}

/**
 * Hook for user message headers
 */
export function useMessagingUserHeaders(userId: string) {
	return useGenericQuery<MessagesHeader[]>({
		queryKey: headerQueryKeys,
		queryFn: () => fetchUserHeaders(userId),
		entityName: "headers",
		operationName: "fetchByUser",
		additionalOptions: {
			enabled: !!userId,
		},
	});
}

/**
 * Hook for all chats
 */
export function useMessagingChats() {
	return useGenericQuery<Chat[]>({
		queryKey: chatQueryKeys,
		queryFn: fetchChats,
		entityName: "chats",
		operationName: "fetchAll",
	});
}

/**
 * Hook for chat by ID
 */
export function useMessagingChatById(chatId: string) {
	return useGenericQuery<Chat | null>({
		queryKey: chatQueryKeys,
		queryFn: () => fetchChatById(chatId),
		entityName: "chats",
		operationName: "fetchById",
		additionalOptions: {
			enabled: !!chatId,
		},
	});
}

/**
 * Hook for messages by chat ID
 */
export function useMessagingMessagesByChat(chatId: string) {
	const query = useGenericQuery<PrivateMessage[]>({
		queryKey: messageQueryKeys,
		queryFn: () => fetchMessagesByChat(chatId),
		entityName: "messages",
		operationName: "fetchByChat",
		additionalOptions: {
			enabled: !!chatId,
		},
	});

	// Set up real-time subscription for new messages
	useEffect(() => {
		if (!chatId) return;

		const channel = supabase
			.channel(`messages:${chatId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "private_messages",
					filter: `chat_id=eq.${chatId}`,
				},
				() => {
					// Refetch messages when there are changes
					query.refetch();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [chatId, query.refetch]);

	return query;
}

/**
 * Hook for private messages between users
 */
export function useMessagingPrivateMessagesBetweenUsers(
	userId1: string,
	userId2: string,
) {
	const query = useGenericQuery<PrivateMessage[]>({
		queryKey: privateMessageQueryKeys,
		queryFn: () => fetchPrivateMessagesBetweenUsers(userId1, userId2),
		entityName: "private_messages",
		operationName: "fetchBetweenUsers",
		additionalOptions: {
			enabled: !!userId1 && !!userId2,
		},
	});

	// Set up real-time subscription for new messages
	useEffect(() => {
		if (!userId1 || !userId2) return;

		const channel = supabase
			.channel(`private_messages:${userId1}:${userId2}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "private_messages",
					filter: `or=(sender_id.eq.${userId1},receiver_id.eq.${userId2}),(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
				},
				() => {
					// Refetch messages when there are changes
					query.refetch();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId1, userId2, query.refetch]);

	return query;
}

/**
 * Hook for header mutations
 */
export function useMessagingHeaderMutations() {
	// Create header mutation
	const createMutation = useCreateMutation(
		async (
			headerData: Omit<MessagesHeader, "id" | "created_at" | "updated_at">,
		) => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const headerWithUser = {
				...headerData,
				user_id: user?.id,
			};

			return messagesQueries.createHeader(headerWithUser);
		},
		{
			queryKeys: headerQueryKeys,
			entityName: "header",
			operationName: "create",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: tempId,
				user_id: undefined, // Will be set by server
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
		},
	);

	// Update header mutation
	const updateMutation = useUpdateMutation(
		async (id: string, data: Partial<MessagesHeader>) => {
			return messagesQueries.updateHeader(id, data);
		},
		{
			queryKeys: headerQueryKeys,
			entityName: "header",
			operationName: "update",
			optimistic: true,
		},
	);

	// Delete header mutation
	const deleteMutation = useDeleteMutation(
		async (id: string) => {
			await messagesQueries.deleteHeader(id);
		},
		{
			queryKeys: headerQueryKeys,
			entityName: "header",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage: "Are you sure you want to delete this message header?",
		},
	);

	return {
		createHeader: createMutation.mutate,
		updateHeader: updateMutation.mutate,
		deleteHeader: deleteMutation.mutate,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,

		reset: () => {
			createMutation.reset();
			updateMutation.reset();
			deleteMutation.reset();
		},
	};
}

/**
 * Hook for chat mutations
 */
export function useMessagingChatMutations() {
	// Create chat mutation
	const createMutation = useCreateMutation(
		async (chatData: Omit<Chat, "id" | "created_at" | "updated_at">) => {
			const { data, error } = await supabase
				.from("chat")
				.insert([chatData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: chatQueryKeys,
			entityName: "chat",
			operationName: "create",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: tempId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
		},
	);

	// Update chat mutation
	const updateMutation = useUpdateMutation(
		async (id: string, data: Partial<Chat>) => {
			const { data: updatedChat, error } = await supabase
				.from("chat")
				.update({ ...data, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedChat;
		},
		{
			queryKeys: chatQueryKeys,
			entityName: "chat",
			operationName: "update",
			optimistic: true,
		},
	);

	// Delete chat mutation
	const deleteMutation = useDeleteMutation(
		async (id: string) => {
			const { error } = await supabase.from("chat").delete().eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: chatQueryKeys,
			entityName: "chat",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage:
				"Are you sure you want to delete this chat? This will also delete all messages.",
		},
	);

	return {
		createChat: createMutation.mutate,
		updateChat: updateMutation.mutate,
		deleteChat: deleteMutation.mutate,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,

		reset: () => {
			createMutation.reset();
			updateMutation.reset();
			deleteMutation.reset();
		},
	};
}

/**
 * Hook for message mutations
 */
export function useMessagingMessageMutations() {
	// Send message mutation
	const sendMessageMutation = useCreateMutation(
		async (
			messageData: Omit<PrivateMessage, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("private_messages")
				.insert([messageData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: messageQueryKeys,
			entityName: "message",
			operationName: "send",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: tempId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				read: false,
			}),
		},
	);

	// Mark message as read mutation
	const markAsReadMutation = useUpdateMutation(
		async (id: string) => {
			const { data: updatedMessage, error } = await supabase
				.from("private_messages")
				.update({ read: true, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedMessage;
		},
		{
			queryKeys: messageQueryKeys,
			entityName: "message",
			operationName: "markAsRead",
			optimistic: true,
		},
	);

	// Delete message mutation
	const deleteMessageMutation = useDeleteMutation(
		async (id: string) => {
			const { error } = await supabase
				.from("private_messages")
				.delete()
				.eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: messageQueryKeys,
			entityName: "message",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage: "Are you sure you want to delete this message?",
		},
	);

	// Mark all messages as read for a chat
	const markAllAsReadMutation = useCustomMutation(
		async (chatId: string) => {
			const { error } = await supabase
				.from("private_messages")
				.update({ read: true, updated_at: new Date().toISOString() })
				.eq("chat_id", chatId)
				.eq("read", false);

			if (error) throw error;
		},
		{
			queryKeys: messageQueryKeys,
			entityName: "message",
			operationName: "markAllAsRead",
		},
	);

	return {
		sendMessage: sendMessageMutation.mutate,
		markAsRead: markAsReadMutation.mutate,
		deleteMessage: deleteMessageMutation.mutate,
		markAllAsRead: markAllAsReadMutation.mutate,

		isSending: sendMessageMutation.isPending,
		isMarkingAsRead: markAsReadMutation.isPending,
		isDeleting: deleteMessageMutation.isPending,
		isMarkingAllAsRead: markAllAsReadMutation.isPending,

		sendError: sendMessageMutation.error,
		markAsReadError: markAsReadMutation.error,
		deleteError: deleteMessageMutation.error,
		markAllAsReadError: markAllAsReadMutation.error,

		reset: () => {
			sendMessageMutation.reset();
			markAsReadMutation.reset();
			deleteMessageMutation.reset();
			markAllAsReadMutation.reset();
		},
	};
}

/**
 * Export query keys for external use
 */
export {
	headerQueryKeys,
	chatQueryKeys,
	messageQueryKeys,
	privateMessageQueryKeys,
};

/**
 * Default export - unified messaging hook with options
 */
export default function useMessaging(options?: {
	mode?: "headers" | "chats" | "messages";
	chatId?: string;
	userId?: string;
	userId1?: string;
	userId2?: string;
}) {
	const { mode = "headers", chatId, userId, userId1, userId2 } = options || {};

	switch (mode) {
		case "headers":
			if (userId) {
				return useMessagingUserHeaders(userId);
			}
			return useMessagingHeaders();
		case "chats":
			if (chatId) {
				return useMessagingChatById(chatId);
			}
			return useMessagingChats();
		case "messages":
			if (chatId) {
				return useMessagingMessagesByChat(chatId);
			}
			if (userId1 && userId2) {
				return useMessagingPrivateMessagesBetweenUsers(userId1, userId2);
			}
			throw new Error("chatId or userId1/userId2 required for messages mode");
		default:
			return useMessagingHeaders();
	}
}
