/**
 * Unified Presence Hook
 *
 * Consolidates presence tracking, real-time updates, and status management
 * into a single, optimized API following the new entity architecture.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";

// Import new architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { useGenericQuery } from "../core/useGenericQuery";
import { useCustomMutation } from "../core/useMutationHooks";

/**
 * Presence query keys using the new unified system
 */
const presenceQueryKeys = new EntityQueryKeys("presence");

/**
 * Presence user interface
 */
export interface PresenceUser {
	user_id: string;
	username?: string;
	avatar_url?: string;
	online_at: string;
	last_seen?: string;
	status?: "online" | "away" | "busy" | "offline";
	custom_status?: string;
}

/**
 * Presence options interface
 */
export interface UsePresenceOptions {
	channelName?: string;
	enablePresence?: boolean;
	autoTrack?: boolean;
	heartbeatInterval?: number;
}

/**
 * Fetch online users from database
 */
async function fetchOnlineUsers(): Promise<PresenceUser[]> {
	const { data, error } = await supabase
		.from("user_presence")
		.select("*")
		.gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes
		.order("last_seen", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Hook for presence tracking and management
 */
export function usePresence(options: UsePresenceOptions = {}) {
	const {
		channelName = "global_presence",
		enablePresence = true,
		autoTrack = true,
		heartbeatInterval = 60000, // 1 minute
	} = options;

	const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
	const [isTracking, setIsTracking] = useState(false);
	const [currentUserStatus, setCurrentUserStatus] = useState<string>("online");
	const channelRef = useRef<RealtimeChannel | null>(null);
	const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Query for initial online users
	const presenceQuery = useGenericQuery<PresenceUser[]>({
		queryKey: presenceQueryKeys,
		queryFn: fetchOnlineUsers,
		entityName: "presence",
		operationName: "fetchOnlineUsers",
		additionalOptions: {
			enabled: enablePresence,
		},
		cacheOverrides: {
			refetchInterval: 30000, // Refetch every 30 seconds
		},
	});

	// Update presence state when query data changes
	useEffect(() => {
		if (presenceQuery.data) {
			setOnlineUsers(presenceQuery.data);
		}
	}, [presenceQuery.data]);

	// Update user presence in database
	const updatePresence = useCallback(async (status = "online") => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase.from("user_presence").upsert(
				{
					user_id: user.id,
					username: user.user_metadata?.username || user.email?.split("@")[0],
					avatar_url: user.user_metadata?.avatar_url,
					status,
					last_seen: new Date().toISOString(),
				},
				{
					onConflict: "user_id",
				},
			);

			if (error) throw error;
		} catch (error) {
			console.error("Failed to update presence:", error);
		}
	}, []);

	// Start presence tracking
	const startTracking = useCallback(async () => {
		if (!enablePresence || isTracking) return;

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			setIsTracking(true);

			// Set up real-time channel
			const channel = supabase.channel(channelName);

			channel
				.on("presence", { event: "sync" }, () => {
					const newState = channel.presenceState();
					const users: PresenceUser[] = [];

					for (const userArray of Object.values(newState)) {
						if (Array.isArray(userArray)) {
							for (const presenceUser of userArray) {
								if (
									presenceUser &&
									typeof presenceUser === "object" &&
									"user_id" in presenceUser &&
									"online_at" in presenceUser
								) {
									users.push(presenceUser as unknown as PresenceUser);
								}
							}
						}
					}

					setOnlineUsers(users);
				})
				.on("presence", { event: "join" }, ({ key, newPresences }) => {
					console.log("User joined:", key, newPresences);
				})
				.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
					console.log("User left:", key, leftPresences);
				})
				.subscribe(async (status) => {
					if (status === "SUBSCRIBED") {
						// Track current user presence
						await channel.track({
							user_id: user.id,
							username:
								user.user_metadata?.username || user.email?.split("@")[0],
							avatar_url: user.user_metadata?.avatar_url,
							online_at: new Date().toISOString(),
							status: currentUserStatus,
						});

						// Update database presence
						await updatePresence(currentUserStatus);

						// Set up heartbeat if auto-tracking is enabled
						if (autoTrack) {
							heartbeatIntervalRef.current = setInterval(() => {
								updatePresence(currentUserStatus);
							}, heartbeatInterval);
						}
					}
				});

			channelRef.current = channel;
		} catch (error) {
			console.error("Failed to start presence tracking:", error);
			setIsTracking(false);
		}
	}, [
		enablePresence,
		isTracking,
		channelName,
		currentUserStatus,
		autoTrack,
		heartbeatInterval,
		updatePresence,
	]);

	// Stop presence tracking
	const stopTracking = useCallback(() => {
		if (!isTracking) return;

		if (heartbeatIntervalRef.current) {
			clearInterval(heartbeatIntervalRef.current);
			heartbeatIntervalRef.current = null;
		}

		if (channelRef.current) {
			supabase.removeChannel(channelRef.current);
			channelRef.current = null;
		}

		setIsTracking(false);
	}, [isTracking]);

	// Update user status
	const updateStatus = useCallback(
		async (status: string) => {
			setCurrentUserStatus(status);

			if (isTracking && channelRef.current) {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (user) {
					await channelRef.current.track({
						user_id: user.id,
						username: user.user_metadata?.username || user.email?.split("@")[0],
						avatar_url: user.user_metadata?.avatar_url,
						online_at: new Date().toISOString(),
						status,
					});
				}
			}

			await updatePresence(status);
		},
		[isTracking, updatePresence],
	);

	// Get user by ID
	const getUserById = useCallback(
		(userId: string): PresenceUser | undefined => {
			return onlineUsers.find((user) => user.user_id === userId);
		},
		[onlineUsers],
	);

	// Check if user is online
	const isUserOnline = useCallback(
		(userId: string): boolean => {
			const user = getUserById(userId);
			if (!user) return false;

			const lastSeen = new Date(user.last_seen || user.online_at);
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
			return lastSeen > fiveMinutesAgo;
		},
		[getUserById],
	);

	// Auto-start tracking when component mounts
	useEffect(() => {
		if (enablePresence && autoTrack) {
			startTracking();
		}

		return () => {
			stopTracking();
		};
	}, [enablePresence, autoTrack, startTracking, stopTracking]);

	return {
		// State
		onlineUsers,
		isTracking,
		currentUserStatus,

		// Query state
		isLoading: presenceQuery.isLoading,
		error: presenceQuery.error,
		refetch: presenceQuery.refetch,

		// Actions
		startTracking,
		stopTracking,
		updateStatus,

		// Utilities
		getUserById,
		isUserOnline,

		// Computed values
		onlineUserCount: onlineUsers.length,
	};
}

/**
 * Hook for presence mutations
 */
export function usePresenceMutations() {
	// Set user status mutation
	const setStatusMutation = useCustomMutation(
		async ({
			status,
			customStatus,
		}: { status: string; customStatus?: string }) => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { error } = await supabase.from("user_presence").upsert(
				{
					user_id: user.id,
					username: user.user_metadata?.username || user.email?.split("@")[0],
					avatar_url: user.user_metadata?.avatar_url,
					status,
					custom_status: customStatus,
					last_seen: new Date().toISOString(),
				},
				{
					onConflict: "user_id",
				},
			);

			if (error) throw error;
		},
		{
			queryKeys: presenceQueryKeys,
			entityName: "presence",
			operationName: "setStatus",
		},
	);

	// Clear user presence mutation
	const clearPresenceMutation = useCustomMutation(
		async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { error } = await supabase
				.from("user_presence")
				.delete()
				.eq("user_id", user.id);

			if (error) throw error;
		},
		{
			queryKeys: presenceQueryKeys,
			entityName: "presence",
			operationName: "clearPresence",
		},
	);

	return {
		setStatus: setStatusMutation.mutate,
		clearPresence: clearPresenceMutation.mutate,

		isSettingStatus: setStatusMutation.isPending,
		isClearingPresence: clearPresenceMutation.isPending,

		setStatusError: setStatusMutation.error,
		clearPresenceError: clearPresenceMutation.error,

		reset: () => {
			setStatusMutation.reset();
			clearPresenceMutation.reset();
		},
	};
}

/**
 * Hook for simple presence status tracking (without real-time)
 */
export function usePresenceStatus() {
	return useGenericQuery<PresenceUser[]>({
		queryKey: presenceQueryKeys,
		queryFn: fetchOnlineUsers,
		entityName: "presence",
		operationName: "fetchStatus",
		cacheOverrides: {
			refetchInterval: 30000, // Refetch every 30 seconds
		},
	});
}

/**
 * Export query keys for external use
 */
export { presenceQueryKeys };

/**
 * Default export - unified presence hook with options
 */
export default function usePresenceWithOptions(options?: UsePresenceOptions) {
	return usePresence(options);
}
