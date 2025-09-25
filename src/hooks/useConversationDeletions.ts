import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ConversationDeletion } from "../types/database";

export const conversationDeletionKeys = {
	all: ["conversation-deletions"] as const,
	lists: () => [...conversationDeletionKeys.all, "list"] as const,
	list: (filters: string) =>
		[...conversationDeletionKeys.lists(), { filters }] as const,
	details: () => [...conversationDeletionKeys.all, "detail"] as const,
	detail: (id: string) => [...conversationDeletionKeys.details(), id] as const,
	byUser: (userId: string) =>
		[...conversationDeletionKeys.all, "user", userId] as const,
	byParticipant: (participantId: string) =>
		[...conversationDeletionKeys.all, "participant", participantId] as const,
	betweenUsers: (userId: string, participantId: string) =>
		[
			...conversationDeletionKeys.all,
			"between",
			userId,
			participantId,
		] as const,
};

export function useConversationDeletions() {
	return useQuery({
		queryKey: conversationDeletionKeys.lists(),
		queryFn: async () => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const { data, error } = await supabase
				.from("conversation_deletions")
				.select("*")
				.eq("user_id", user?.id)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useConversationDeletion(id: string) {
	return useQuery({
		queryKey: conversationDeletionKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("conversation_deletions")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useConversationDeletionsByUser(userId: string) {
	return useQuery({
		queryKey: conversationDeletionKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("conversation_deletions")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function useConversationDeletionsByParticipant(participantId: string) {
	return useQuery({
		queryKey: conversationDeletionKeys.byParticipant(participantId),
		queryFn: async () => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const { data, error } = await supabase
				.from("conversation_deletions")
				.select("*")
				.eq("user_id", user?.id)
				.eq("participant_id", participantId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!participantId,
	});
}

export function useConversationDeletionsBetweenUsers(
	userId: string,
	participantId: string,
) {
	return useQuery({
		queryKey: conversationDeletionKeys.betweenUsers(userId, participantId),
		queryFn: async () => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			const { data, error } = await supabase
				.from("conversation_deletions")
				.select("*")
				.eq("user_id", user?.id)
				.or(`participant_id.eq.${participantId},participant_id.eq.${userId}`)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!(userId && participantId),
	});
}

// RLS: INSERT restricted to own records (auth.uid() = user_id)
export function useCreateConversationDeletion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			newDeletion: Omit<ConversationDeletion, "id" | "created_at">,
		) => {
			const { data, error } = await supabase
				.from("conversation_deletions")
				.insert([newDeletion])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.byUser(data.user_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.byParticipant(data.participant_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.betweenUsers(
					data.user_id,
					data.participant_id,
				),
			});
		},
	});
}

// RLS: UPDATE restricted to own records (auth.uid() = user_id)
export function useUpdateConversationDeletion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			...updates
		}: Partial<ConversationDeletion> & { id: string }) => {
			const { data, error } = await supabase
				.from("conversation_deletions")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.detail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.byUser(data.user_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.byParticipant(data.participant_id),
			});
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.betweenUsers(
					data.user_id,
					data.participant_id,
				),
			});
		},
	});
}

// RLS: DELETE restricted to own records (auth.uid() = user_id)
export function useDeleteConversationDeletion() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from("conversation_deletions")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (id) => {
			queryClient.invalidateQueries({
				queryKey: conversationDeletionKeys.lists(),
			});
			queryClient.removeQueries({
				queryKey: conversationDeletionKeys.detail(id),
			});
		},
	});
}
