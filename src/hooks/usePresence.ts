import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UsePresenceOptions {
	channelName?: string;
	enablePresence?: boolean;
}

interface PresenceUser {
	user_id: string;
	username?: string;
	avatar_url?: string;
	online_at: string;
}

export function usePresence(options: UsePresenceOptions = {}) {
	const { channelName = "global_presence", enablePresence = true } = options;
	const { user } = useAuth();
	const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
	const [isTracking, setIsTracking] = useState(false);
	const channelRef = useRef<RealtimeChannel | null>(null);

	useEffect(() => {
		if (!enablePresence || !user?.id) {
			return;
		}

		const channel = supabase.channel(channelName);

		channel
			.on("presence", { event: "sync" }, () => {
				const newState = channel.presenceState();
				const users: PresenceUser[] = [];
				for (const userArray of Object.values(newState)) {
					if (Array.isArray(userArray)) {
						for (const user of userArray) {
							if (
								user &&
								typeof user === "object" &&
								"user_id" in user &&
								"online_at" in user
							) {
								users.push(user as unknown as PresenceUser);
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
			});

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				setIsTracking(true);
				await channel.track({
					user_id: user.id,
					username: user.username || user.full_name,
					avatar_url: user.avatar_url,
					online_at: new Date().toISOString(),
				});
			}
		});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				channelRef.current.untrack();
				channelRef.current.unsubscribe();
				setIsTracking(false);
				setOnlineUsers([]);
			}
		};
	}, [
		user?.id,
		user?.username,
		user?.full_name,
		user?.avatar_url,
		channelName,
		enablePresence,
	]);

	const trackPresence = async (customState?: Record<string, unknown>) => {
		if (!channelRef.current || !user?.id) return;
		return await channelRef.current.track(customState || {});
	};

	const untrackPresence = async () => {
		if (channelRef.current) {
			return await channelRef.current.untrack();
		}
	};

	return {
		onlineUsers,
		isTracking,
		trackPresence,
		untrackPresence,
		onlineCount: onlineUsers.length,
		currentUserOnline: onlineUsers.some((u) => u.user_id === user?.id),
	};
}
