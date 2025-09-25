import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";

export function useRealtimeSync() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Services realtime subscription
		const servicesSubscription = supabase
			.channel("services-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_services",
				},
				(payload) => {
					console.log("Services change:", payload);
					// Invalidate services queries
					queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
				},
			)
			.subscribe();

		// Businesses realtime subscription
		const businessesSubscription = supabase
			.channel("businesses-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_business_inside",
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.businesses.inside(),
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_business_outside",
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.businesses.outside(),
					});
				},
			)
			.subscribe();

		// Marketplace realtime subscription
		const marketplaceSubscription = supabase
			.channel("marketplace-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "marketplace_listings",
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.marketplace.all,
					});
				},
			)
			.subscribe();

		// Messages headers realtime subscription
		const messagesSubscription = supabase
			.channel("messages-changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "messages_header",
				},
				() => {
					queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
				},
			)
			.subscribe();

		// Profiles realtime subscription
		const profilesSubscription = supabase
			.channel("profiles-changes")
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "profiles",
				},
				(payload) => {
					const profileId = payload.new.id;
					// Invalidate specific profile queries
					queryClient.invalidateQueries({
						queryKey: queryKeys.profiles.detail(profileId),
					});
					queryClient.invalidateQueries({
						queryKey: queryKeys.auth.profile(profileId),
					});
				},
			)
			.subscribe();

		// Cleanup subscriptions
		return () => {
			servicesSubscription.unsubscribe();
			businessesSubscription.unsubscribe();
			marketplaceSubscription.unsubscribe();
			messagesSubscription.unsubscribe();
			profilesSubscription.unsubscribe();
		};
	}, [queryClient]);
}

// Hook to enable realtime for specific user data
export function useUserRealtimeSync(userId: string) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!userId) return;

		// User-specific services subscription
		const userServicesSubscription = supabase
			.channel(`user-services-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_services",
					filter: `profile_id=eq.${userId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.services.user(userId),
					});
				},
			)
			.subscribe();

		// User-specific businesses subscription
		const userBusinessesSubscription = supabase
			.channel(`user-businesses-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_business_inside",
					filter: `profile_id=eq.${userId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.businesses.userInside(userId),
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "user_business_outside",
					filter: `profile_id=eq.${userId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.businesses.userOutside(userId),
					});
				},
			)
			.subscribe();

		// User-specific messages subscription
		const userMessagesSubscription = supabase
			.channel(`user-messages-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "messages_header",
					filter: `user_id=eq.${userId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: queryKeys.messages.byUser(userId),
					});
				},
			)
			.subscribe();

		return () => {
			userServicesSubscription.unsubscribe();
			userBusinessesSubscription.unsubscribe();
			userMessagesSubscription.unsubscribe();
		};
	}, [userId, queryClient]);
}
