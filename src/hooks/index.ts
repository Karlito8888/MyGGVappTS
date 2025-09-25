// Authentication
export { useAuth, authKeys } from "./useAuth";

// Business data
export {
	useBusinessesInside,
	useBusinessesOutside,
	useUserBusinessesInside,
	useUserBusinessesOutside,
	useAllBusinesses,
	useUserAllBusinesses,
	useInvalidateBusinesses,
} from "./useBusinesses";

// Services
export {
	useServices,
	useUserServices,
	useInvalidateServices,
} from "./useServices";

// Marketplace
export {
	useMarketplaceListings,
	useMyMarketplaceListings,
	useMarketplaceListing,
	useUpdateMarketplaceListing,
	useDeleteMarketplaceListing,
	useInvalidateMarketplace,
} from "./useMarketplace";

// Messages
export {
	useMessagesHeaders,
	useActiveMessagesHeaders,
	useUserMessagesHeaders,
	useCreateMessageHeader,
	useUpdateMessageHeader,
	useDeleteMessageHeader,
} from "./useMessagesHeaders";

// Profiles
export {
	useProfiles,
	useProfile,
	useCreateProfile,
	useUpdateProfile,
	useDeleteProfile,
} from "./useProfiles";

// Optimistic updates
export {
	useCreateService,
	useCreateMarketplaceListing,
	useOptimisticUpdateMarketplaceListing,
	useOptimisticDeleteMarketplaceListing,
	useUpdateProfile as useOptimisticUpdateProfile,
} from "./useOptimisticUpdates";

// Realtime sync
export {
	useRealtimeSync,
	useUserRealtimeSync,
} from "./useRealtimeSync";

// Route status
export {
	useRouteStatus,
	usePreloadStatus,
} from "./useRouteStatus";

// Legacy hooks (to be migrated or removed)
export * from "./useBusinessInsideCategories";
export * from "./useBusinessOutsideCategories";
export * from "./useConversationCleanupNotifications";
export * from "./useConversationDeletions";
export * from "./useForums";
export * from "./useLocationAssociationRequests";
export * from "./useLocations";
export * from "./useMessaging";
export * from "./useMinLoadingTime";
export * from "./useProfileLocationAssociations";
export * from "./useServiceCategories";
