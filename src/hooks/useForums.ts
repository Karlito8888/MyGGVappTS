import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Forum, Thread } from "../types/database";

export const forumKeys = {
	all: ["forums"] as const,
	lists: () => [...forumKeys.all, "list"] as const,
	list: (filters: string) => [...forumKeys.lists(), { filters }] as const,
	details: () => [...forumKeys.all, "detail"] as const,
	detail: (id: string) => [...forumKeys.details(), id] as const,
	byUser: (userId: string) => [...forumKeys.all, "user", userId] as const,
};

export const threadKeys = {
	all: ["threads"] as const,
	lists: () => [...threadKeys.all, "list"] as const,
	list: (filters: string) => [...threadKeys.lists(), { filters }] as const,
	details: () => [...threadKeys.all, "detail"] as const,
	detail: (id: string) => [...threadKeys.details(), id] as const,
	byForum: (forumId: string) => [...threadKeys.all, "forum", forumId] as const,
	byUser: (userId: string) => [...threadKeys.all, "user", userId] as const,
};

export function useForums() {
	return useQuery({
		queryKey: forumKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("forums")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useForum(id: string) {
	return useQuery({
		queryKey: forumKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("forums")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useUserForums(userId: string) {
	return useQuery({
		queryKey: forumKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("forums")
				.select("*")
				.eq("created_by", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function useThreads() {
	return useQuery({
		queryKey: threadKeys.lists(),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("threads")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});
}

export function useThread(id: string) {
	return useQuery({
		queryKey: threadKeys.detail(id),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("threads")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		},
		enabled: !!id,
	});
}

export function useForumThreads(forumId: string) {
	return useQuery({
		queryKey: threadKeys.byForum(forumId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("threads")
				.select("*")
				.eq("forum_id", forumId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!forumId,
	});
}

export function useUserThreads(userId: string) {
	return useQuery({
		queryKey: threadKeys.byUser(userId),
		queryFn: async () => {
			const { data, error } = await supabase
				.from("threads")
				.select("*")
				.eq("created_by", userId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
		enabled: !!userId,
	});
}

export function useCreateForum() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newForum: Omit<Forum, "id" | "created_at">) => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;
			if (!user) throw new Error("User must be authenticated to create forums");

			const forumWithCreator = {
				...newForum,
				created_by: user.id,
			};

			const { data, error } = await supabase
				.from("forums")
				.insert([forumWithCreator])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: forumKeys.lists() });
			if (data.created_by) {
				queryClient.invalidateQueries({
					queryKey: forumKeys.byUser(data.created_by),
				});
			}
		},
	});
}

export function useCreateThread() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newThread: Omit<Thread, "id" | "created_at">) => {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;
			if (!user)
				throw new Error("User must be authenticated to create threads");

			const threadWithCreator = {
				...newThread,
				created_by: user.id,
			};

			const { data, error } = await supabase
				.from("threads")
				.insert([threadWithCreator])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
			if (data.forum_id) {
				queryClient.invalidateQueries({
					queryKey: threadKeys.byForum(data.forum_id),
				});
			}
			if (data.created_by) {
				queryClient.invalidateQueries({
					queryKey: threadKeys.byUser(data.created_by),
				});
			}
		},
	});
}
