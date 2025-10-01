// ============================================================================
// UNIFIED HOOKS ARCHITECTURE
// ============================================================================

/**
 * Modern, unified hooks architecture following the new entity-based design.
 * This file provides organized exports by functional categories.
 */

// ============================================================================
// CORE ARCHITECTURE
// ============================================================================

// Core utilities and infrastructure
export { EntityQueryKeys } from "./utils/queryKeys";
export { CacheConfigManager } from "./utils/queryConfig";
export {
	SelectorFactory,
	FieldSelectors,
	getFieldSelection,
	getBusinessFields,
	FIELD_SETS,
	CommonSelectors,
	SelectorUtils,
	useMemoizedSelector,
	useFieldSelector,
	messageSelectors,
	marketplaceSelectors,
} from "./utils/selectors";
export { ErrorHandler, type AppError } from "./utils/errorHandling";

// Core hooks for building custom entity hooks
export { useGenericQuery } from "./core/useGenericQuery";
export { useGenericCRUD } from "./core/useGenericCRUD";
export {
	useOptimisticMutation,
	useOptimisticCreate,
	useOptimisticUpdate,
	useOptimisticDelete,
} from "./core/useOptimistic";
export {
	useCreateMutation,
	useUpdateMutation,
	useDeleteMutation,
	useCustomMutation,
} from "./core/useMutationHooks";

// ============================================================================
// ENTITY HOOKS (Primary API - Use these for new development)
// ============================================================================

// Authentication and user management
export {
	useAuth,
	type UseAuthResult,
	type ProfileManagementResult,
} from "./entities/useAuth";

// Profiles management
export {
	useProfiles,
	useProfileMutations,
	useProfileUtils,
	type UseProfilesResult,
	type ProfileMutationsResult,
	type ProfileUtilsResult,
} from "./entities/useProfiles";

// Services management
export {
	useServices,
	type UseServicesResult,
	type ServiceMutationsResult,
} from "./entities/useServices";

// Businesses management
export {
	useBusinesses,
	type UseBusinessesResult,
	type BusinessMutationsResult,
	type BusinessUtilsResult,
} from "./entities/useBusinesses";

// Marketplace management
export {
	useMarketplaceListings,
	useMarketplaceActiveListings,
	useMarketplaceListing,
	useMarketplaceUserListings,
	useMarketplaceMutations,
	marketplaceQueryKeys,
} from "./entities/useMarketplace";
export { default as useMarketplace } from "./entities/useMarketplace";

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Performance and UX utilities
export { useMinLoadingTime } from "./utility/useMinLoadingTime";
export { useDraggable } from "./utility/useDraggable";
export { useSmartFieldSelection } from "./utility/useFieldSelection";
export { useDataPrioritizationManager } from "./utility/useDataPrioritization";
export { useCacheIntegration } from "./utility/useCacheIntegration";
export { useOnboarding } from "./utility/useOnboarding";
export { useUserData } from "./utility/useUserData";

// ============================================================================
// PRESENCE HOOKS (Unified entity hooks)
// ============================================================================

export {
	usePresence,
	usePresenceMutations,
	usePresenceStatus,
	presenceQueryKeys,
} from "./entities/usePresence";
export { default as usePresenceWithOptions } from "./entities/usePresence";

// ============================================================================
// LEGACY COMPATIBILITY (Will be removed in future versions)
// ============================================================================

/**
 * Legacy hooks are maintained for backward compatibility during migration.
 * New code should use the entity hooks above.
 */

// Marketplace (migrated to entities/useMarketplace - legacy exports removed)

// Messages migrated to entities/useMessaging

// Messaging (unified entity hooks)
export {
	useMessagingHeaders,
	useMessagingActiveHeaders,
	useMessagingUserHeaders,
	useMessagingChats,
	useMessagingChatById,
	useMessagingMessagesByChat,
	useMessagingPrivateMessagesBetweenUsers,
	useMessagingHeaderMutations,
	useMessagingChatMutations,
	useMessagingMessageMutations,
} from "./entities/useMessaging";
export { default as useMessaging } from "./entities/useMessaging";

// Locations (unified entity hooks)
export {
	useLocationsList as useLocations,
	useLocationById,
	useUserLocations,
	useNearbyLocations,
	useAssociatedLocationsWithCoords,
	useUserLocationIds,
	useGeolocation,
	useLocationAssociationRequests,
	useLocationAssociationRequestById,
	useLocationAssociationRequestsByRequester,
	useLocationAssociationRequestsByApprover,
	useLocationAssociationRequestsByLocation,
	useLocationAssociationRequestsByStatus,
	useMyLocationAssociationRequests,
	useLocationAssociationRequestMutations,
	useProfileLocationAssociations,
	useProfileLocationAssociationById,
	useProfileLocationAssociationsByProfile,
	useProfileLocationAssociationsByLocation,
	useProfileLocationAssociationMutations,
	locationQueryKeys,
	associationRequestQueryKeys,
	profileAssociationQueryKeys,
} from "./entities/useLocations";
export { default as useLocationsWithOptions } from "./entities/useLocations";

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Quick Migration Reference:
 *
 * ✅ COMPLETED:
 * - useAuth → useAuth (entities)
 * - useProfiles → useProfiles (entities)
 *
 * 🔄 IN PROGRESS:
 * - useMessaging → useMessaging (entities)
 * - usePresence → usePresence (entities)
 * - useLocations → useLocations (entities)
 * - useMarketplace → useMarketplace (entities)
 *
 * 📋 PLANNED:
 * - Remove legacy hooks after full migration
 * - Simplify this index file
 * - Update documentation
 */
