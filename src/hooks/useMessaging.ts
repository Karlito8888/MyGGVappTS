import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Chat, PrivateMessage } from "../types/database";

export const chatKeys = {
	all: ["chats"] as const,
	lists: () => [...chatKeys.all, "list"] as const,
	list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
	details: () => [...chatKeys.all, "detail"] as const,
	detail: (id: string) => [...chatKeys.details(), id] as const,
};

export const messageKeys = {
	all: ["messages"] as const,
	lists: () => [...messageKeys.all, "list"] as const,
	list: (filters: string) => [...messageKeys.lists(), { filters }] as const,
	details: () => [...messageKeys.all, "detail"] as const,
	detail: (id: string) => [...messageKeys.details(), id] as const,
	byChat: (chatId: string) => [...messageKeys.all, "chat", chatId] as const,
	byUser: (userId: string) => [...messageKeys.all, "user", userId] as const,
};

export const privateMessageKeys = {
	all: ["private-messages"] as const,
	lists: () => [...privateMessageKeys.all, "list"] as const,
	list: (filters: string) =>
		[...privateMessageKeys.lists(), { filters }] as const,
	details: () => [...privateMessageKeys.all, "detail"] as const,
	detail: (id: string) => [...privateMessageKeys.details(), id] as const,
	byUser: (userId: string) =>
		[...privateMessageKeys.all, "user", userId] as const,
	betweenUsers: (userId1: string, userId2: string) =>
		[...privateMessageKeys.all, "between", userId1, userId2] as const,
};

export function useChats() {
	return useQuery({
		queryKey: chatKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("chat")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useChat(id: string) {
	return useQuery({
		queryKey: chatKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("chat")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useMessages() {
	return useQuery({
		queryKey: messageKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("chat")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useMessage(id: string) {
	return useQuery({
		queryKey: messageKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("chat")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useChatMessages(chatId: string) {
	return useQuery({
		queryKey: messageKeys.byChat(chatId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("chat")
				.select("*")
				.eq("channel_id", chatId)
				.order("created_at", { ascending: true });

			if (error) throw error;
			return data;
		},
		enabled: !!chatId,
	});
}

export function useUserMessages(userId: string) {
	return useQuery({
		queryKey: messageKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("chat")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function usePrivateMessages() {
	return useQuery({
		queryKey: privateMessageKeys.lists(),
		queryFn: async () => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const { data, error } = await supabase
				.from("private_messages")
				.select("*")
				.or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function usePrivateMessage(id: string) {
	return useQuery({
		queryKey: privateMessageKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("private_messages")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useUserPrivateMessages(userId: string) {
	return useQuery({
		queryKey: privateMessageKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("private_messages")
				.select("*")
				.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function usePrivateMessagesBetweenUsers(
	userId1: string,
	userId2: string,
) {
	return useQuery({
		queryKey: privateMessageKeys.betweenUsers(userId1, userId2),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("private_messages")
				.select("*")
				.or(
					`(sender_id.eq.${userId1},receiver_id.eq.${userId2}),(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
				)
				.order("created_at", { ascending: true });

			if (error) throw error;
			return data;
		},
		enabled: !!(userId1 && userId2),
	});
}

export function useCreateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newChat: Omit<Chat, "id" | "created_at">) => {
			const { data, error } = await supabase
				.from("chat")
				.insert([newChat])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
		},
	});
}

export function useUpdateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...updates }: Partial<Chat> & { id: string }) => {
			const { data, error } = await supabase
				.from("chat")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
			queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
		},
	});
}

export function useDeleteChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("chat")
				.delete()
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
			queryClient.removeQueries({ queryKey: chatKeys.detail(data.id) });
		},
	});
}

export function useCreateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newMessage: Omit<Chat, "id" | "created_at">) => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const messageWithUser = {
				...newMessage,
				user_id: user?.id,
			};

			const { data, error } = await supabase
				.from("chat")
				.insert([messageWithUser])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: messageKeys.byChat(data.channel_id),
			});
			if (data.user_id) {
				queryClient.invalidateQueries({
					queryKey: messageKeys.byUser(data.user_id),
				});
			}
		},
	});
}

export function useUpdateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...updates }: Partial<Chat> & { id: string }) => {
			const { data, error } = await supabase
				.from("chat")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
			queryClient.invalidateQueries({ queryKey: messageKeys.detail(data.id) });
			queryClient.invalidateQueries({
				queryKey: messageKeys.byChat(data.channel_id),
			});
			queryClient.invalidateQueries({
				queryKey: messageKeys.byUser(data.user_id),
			});
		},
	});
}

export function useDeleteMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { data, error } = await supabase
				.from("chat")
				.delete()
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
			queryClient.removeQueries({ queryKey: messageKeys.detail(data.id) });
			queryClient.invalidateQueries({
				queryKey: messageKeys.byChat(data.channel_id),
			});
			queryClient.invalidateQueries({
				queryKey: messageKeys.byUser(data.user_id),
			});
		},
	});
}

export function useCreatePrivateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newMessage: Omit<PrivateMessage, "id" | "created_at">,
		) => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const messageWithSender = {
				...newMessage,
				sender_id: user?.id,
			};

			const { data, error } = await supabase
				.from("private_messages")
				.insert([messageWithSender])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: privateMessageKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.byUser(data.sender_id),
			});
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.byUser(data.receiver_id),
			});
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.betweenUsers(
					data.sender_id,
					data.receiver_id,
				),
			});
		},
	});
}

export function useUpdatePrivateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<PrivateMessage> & { id: string }) => {
			const { data, error } = await supabase
				.from("private_messages")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: privateMessageKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.byUser(data.sender_id),
			});
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.byUser(data.receiver_id),
			});
			queryClient.invalidateQueries({
				queryKey: privateMessageKeys.betweenUsers(
					data.sender_id,
					data.receiver_id,
				),
			});
		},
	});
}

export function useDeletePrivateMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from("private_messages")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (id) => {
			queryClient.invalidateQueries({ queryKey: privateMessageKeys.lists() });
			queryClient.removeQueries({
				queryKey: privateMessageKeys.detail(id),
			});
		},
	});
}
