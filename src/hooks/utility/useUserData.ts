import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryKeys } from "../utils/queryKeys";
import type {
	BusinessInside,
	BusinessOutside,
	MarketplaceListing,
	MessagesHeader,
	Profile,
	ProfileLocationAssociation,
	Service,
} from "../../types/database";
import { useAuth } from "../entities/useAuth";
import { useBusinesses } from "../entities/useBusinesses";
import { useUserLocationIds, useUserLocations } from "../entities/useLocations";
import { useMarketplaceUserListings } from "../entities/useMarketplace";
import { useMessagingHeaders } from "../entities/useMessaging";
import { useProfiles } from "../entities/useProfiles";
import { useServices } from "../entities/useServices";

/**
 * Comprehensive user data aggregation hook
 * Provides all user-related data in a single, optimized hook
 */
export interface UserData {
	profile: Profile | null;
	services: Service[];
	businesses: {
		inside: BusinessInside[];
		outside: BusinessOutside[];
	};
	locations: ProfileLocationAssociation[]; // User's location associations
	marketplace: MarketplaceListing[];
	messages: MessagesHeader[]; // Message headers
	locationIds: string[];
}

/**
 * Hook that aggregates all user-related data
 * Optimized for performance with smart loading states
 */
export function useUserData(userId?: string) {
	const { user: currentUser } = useAuth();
	const effectiveUserId = userId || currentUser?.id;

	// Core user data - high priority
	const profile = useProfiles({ mode: "byId", id: effectiveUserId || "" });
	const services = useServices().byUser(effectiveUserId || "");
	const businessesInside = useBusinesses().byUserInside(effectiveUserId || "");
	const businessesOutside = useBusinesses().byUserOutside(
		effectiveUserId || "",
	);
	const locations = useUserLocations(effectiveUserId || "");
	const marketplace = useMarketplaceUserListings(effectiveUserId || "");
	const messages = useMessagingHeaders();
	const locationIds = useUserLocationIds(effectiveUserId || "");

	// Combined loading states with priority levels
	const isLoading = {
		high: profile.loading,
		medium:
			services.loading || businessesInside.loading || businessesOutside.loading,
		low: locations.isLoading || marketplace.isLoading || messages.isLoading,
		any:
			profile.loading ||
			services.loading ||
			businessesInside.loading ||
			businessesOutside.loading ||
			locations.isLoading ||
			marketplace.isLoading ||
			messages.isLoading,
	};

	// Combined error states
	const errors = {
		profile: profile.error,
		services: services.error,
		businessesInside: businessesInside.error,
		businessesOutside: businessesOutside.error,
		locations: locations.error,
		marketplace: marketplace.error,
		messages: messages.error,
		any:
			profile.error ||
			services.error ||
			businessesInside.error ||
			businessesOutside.error ||
			locations.error ||
			marketplace.error ||
			messages.error,
	};

	// Aggregated data
	const data: UserData = {
		profile: profile.profile || null,
		services: services.services || [],
		businesses: {
			inside: businessesInside.businesses || [],
			outside: businessesOutside.businesses || [],
		},
		locations:
			(locations.data as unknown as ProfileLocationAssociation[]) || [],
		marketplace: (marketplace.data as MarketplaceListing[]) || [],
		messages: (messages.data as MessagesHeader[]) || [],
		locationIds: locationIds.data || [],
	};

	// Combined refetch function
	const refetch = async () => {
		const results = await Promise.allSettled([
			profile.refetch(),
			services.refetch(),
			businessesInside.refetch(),
			businessesOutside.refetch(),
			locations.refetch(),
			marketplace.refetch(),
			messages.refetch(),
			locationIds.refetch(),
		]);

		// Log any refetch errors
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				const names = [
					"profile",
					"services",
					"businessesInside",
					"businessesOutside",
					"locations",
					"marketplace",
					"messages",
					"locationIds",
				];
				console.error(`Failed to refetch ${names[index]}:`, result.reason);
			}
		});
	};

	// Data availability checks
	const isDataAvailable = {
		profile: !!profile.profile,
		services: !!(services.services && services.services.length > 0),
		businesses: !!(
			(businessesInside.businesses && businessesInside.businesses.length > 0) ||
			(businessesOutside.businesses && businessesOutside.businesses.length > 0)
		),
		locations: !!(locations.data && locations.data.length > 0),
		marketplace: !!(marketplace.data && marketplace.data.length > 0),
		messages: !!(messages.data && messages.data.length > 0),
		all:
			!!profile.profile &&
			!!services.services &&
			!!businessesInside.businesses &&
			!!businessesOutside.businesses &&
			!!locations.data &&
			!!marketplace.data &&
			!!messages.data,
	};

	// Statistics for dashboard
	const stats = {
		totalServices: data.services.length,
		totalBusinesses:
			data.businesses.inside.length + data.businesses.outside.length,
		totalLocations: data.locations.length,
		totalMarketplaceListings: data.marketplace.length,
		totalMessages: data.messages.length,
		activeServices: data.services.filter((s) => s.is_active).length,
		activeBusinesses: [
			...data.businesses.inside.filter((b) => b.is_active),
			...data.businesses.outside.filter((b) => b.is_active),
		].length,
	};

	return {
		data,
		isLoading,
		errors,
		refetch,
		isDataAvailable,
		stats,
		// Individual queries for granular control
		queries: {
			profile,
			services,
			businessesInside,
			businessesOutside,
			locations,
			marketplace,
			messages,
			locationIds,
		},
	};
}

/**
 * Hook for user data summary (lightweight version)
 * Useful for dashboards and overviews
 */
export function useUserDataSummary(userId?: string) {
	const { user: currentUser } = useAuth();
	const effectiveUserId = userId || currentUser?.id;

	return useQuery({
		queryKey: [...queryKeys.profiles.all(), "user-summary", effectiveUserId],
		queryFn: async () => {
			if (!effectiveUserId) return null;

			// Fetch only essential data for summary
			const [profile, services, businesses, locations, marketplace] =
				await Promise.allSettled([
					fetch(`/api/profiles/${effectiveUserId}`).then((res) => res.json()),
					fetch(`/api/services/user/${effectiveUserId}?summary=true`).then(
						(res) => res.json(),
					),
					fetch(`/api/businesses/user/${effectiveUserId}?summary=true`).then(
						(res) => res.json(),
					),
					fetch(`/api/locations/user/${effectiveUserId}?summary=true`).then(
						(res) => res.json(),
					),
					fetch(`/api/marketplace/user/${effectiveUserId}?summary=true`).then(
						(res) => res.json(),
					),
				]);

			return {
				profile: profile.status === "fulfilled" ? profile.value : null,
				services: services.status === "fulfilled" ? services.value : [],
				businesses:
					businesses.status === "fulfilled"
						? businesses.value
						: { inside: [], outside: [] },
				locations: locations.status === "fulfilled" ? locations.value : [],
				marketplace:
					marketplace.status === "fulfilled" ? marketplace.value : [],
			};
		},
		enabled: !!effectiveUserId,
		staleTime: 1000 * 60 * 2, // 2 minutes for summary data
		gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
	});
}

/**
 * Hook for user data with real-time updates
 * Combines aggregated data with real-time synchronization
 */
export function useUserDataWithRealtime(userId?: string) {
	const userData = useUserData(userId);
	const { user: currentUser } = useAuth();
	const effectiveUserId = userId || currentUser?.id;

	// This would integrate with useUserRealtimeSync from useRealtimeSync.ts
	// For now, we'll return the aggregated data with a placeholder for realtime
	return {
		...userData,
		isRealtimeEnabled: !!effectiveUserId,
		realtimeStatus: "connected", // This would be managed by the realtime hook
	};
}

/**
 * Hook for user data with offline support
 * Provides fallback data when offline
 */
export function useUserDataWithOffline(userId?: string) {
	const userData = useUserData(userId);
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return {
		...userData,
		isOnline,
		// Offline data would be loaded from localStorage or IndexedDB
		offlineData: isOnline ? null : getOfflineUserData(userId),
	};
}

// Helper function to get offline user data
function getOfflineUserData(userId?: string): UserData | null {
	if (!userId) return null;

	try {
		const offlineData = localStorage.getItem(`user-data-${userId}`);
		return offlineData ? JSON.parse(offlineData) : null;
	} catch {
		return null;
	}
}
