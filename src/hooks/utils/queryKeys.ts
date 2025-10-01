/**
 * Unified Query Keys System
 *
 * Provides a centralized, type-safe system for generating and managing
 * TanStack Query keys with consistent patterns across all entities.
 */

/**
 * Interface for query key factory with standardized methods
 */
export interface QueryKeyFactory {
	/** Base key for the entity */
	all(): readonly string[];
	/** Keys for list queries */
	lists(): readonly string[];
	/** Keys for detail queries */
	details(): readonly string[];
	/** Keys filtered by user */
	byUser(userId: string): readonly string[];
	/** Keys filtered by custom filter */
	byFilter(filter: Record<string, any>): readonly string[];
	/** Key for specific item by ID */
	byId(id: string): readonly string[];
}

/**
 * Entity-specific query keys implementation
 */
export class EntityQueryKeys implements QueryKeyFactory {
	constructor(private readonly entityName: string) {}

	all = (): readonly string[] => [this.entityName] as const;

	lists = (): readonly string[] => [...this.all(), "list"] as const;

	details = (): readonly string[] => [...this.all(), "detail"] as const;

	byUser = (userId: string): readonly string[] =>
		[...this.all(), "user", userId] as const;

	byFilter = (filter: Record<string, any>): readonly string[] =>
		[...this.all(), "filter", JSON.stringify(filter)] as const;

	byId = (id: string): readonly string[] => [...this.details(), id] as const;
}

/**
 * Pre-defined query keys for all entities
 */
export const queryKeys = {
	// Authentication
	auth: new EntityQueryKeys("auth"),

	// User profiles
	profiles: new EntityQueryKeys("profiles"),
	user: new EntityQueryKeys("user"), // Legacy compatibility

	// Services
	services: new EntityQueryKeys("services"),
	serviceCategories: new EntityQueryKeys("serviceCategories"),

	// Businesses
	businesses: new EntityQueryKeys("businesses"),
	businessesInside: new EntityQueryKeys("businessesInside"),
	businessesOutside: new EntityQueryKeys("businessesOutside"),
	inside: new EntityQueryKeys("inside"), // Legacy compatibility
	outside: new EntityQueryKeys("outside"), // Legacy compatibility
	userInside: new EntityQueryKeys("userInside"), // Legacy compatibility
	userOutside: new EntityQueryKeys("userOutside"), // Legacy compatibility

	// Marketplace
	marketplace: new EntityQueryKeys("marketplace"),
	listings: new EntityQueryKeys("listings"), // Legacy compatibility

	// Messages and conversations
	messages: new EntityQueryKeys("messages"),
	conversations: new EntityQueryKeys("conversations"),
	headers: new EntityQueryKeys("headers"), // Legacy compatibility
	active: new EntityQueryKeys("active"), // Legacy compatibility

	// Locations
	locations: new EntityQueryKeys("locations"),
	locationAssociations: new EntityQueryKeys("locationAssociations"),

	// Forums
	forums: new EntityQueryKeys("forums"),

	// Presence and real-time
	presence: new EntityQueryKeys("presence"),

	// Storage
	storage: new EntityQueryKeys("storage"),
} as const;

/**
 * Utility functions for query key manipulation
 */
export const QueryKeyUtils = {
	/**
	 * Extract entity name from query key
	 */
	getEntityName: (queryKey: readonly string[]): string | null =>
		queryKey[0] || null,

	/**
	 * Check if query key belongs to specific entity
	 */
	isEntity: (queryKey: readonly string[], entityName: string): boolean =>
		queryKey[0] === entityName,

	/**
	 * Check if query key is a list query
	 */
	isListQuery: (queryKey: readonly string[]): boolean => queryKey[1] === "list",

	/**
	 * Check if query key is a single item query
	 */
	isSingleQuery: (queryKey: readonly string[]): boolean =>
		queryKey[1] === "single",

	/**
	 * Check if query key is a detail query
	 */
	isDetailQuery: (queryKey: readonly string[]): boolean =>
		queryKey[1] === "detail",

	/**
	 * Extract ID from query key
	 */
	getId: (queryKey: readonly string[]): string | null => queryKey[2] || null,

	/**
	 * Create invalidation patterns for entity
	 */
	getInvalidationPatterns: (entityName: string): readonly string[][] => [
		[entityName],
		[entityName, "list"],
		[entityName, "single"],
		[entityName, "detail"],
	],

	/**
	 * Check if query should be invalidated
	 */
	shouldInvalidate: (
		queryKey: readonly string[],
		entityName: string,
	): boolean => queryKey[0] === entityName,

	/**
	 * Get cache key for entity
	 */
	getCacheKey: (entityName: string): string =>
		`GGV_${entityName.toUpperCase()}_CACHE`,

	/**
	 * Get version key for entity
	 */
	getVersionKey: (entityName: string): string =>
		`GGV_${entityName.toUpperCase()}_VERSION`,

	/**
	 * Get all related query keys for invalidation
	 */
	getRelatedKeys: (entityName: string, id?: string): readonly string[][] => {
		const keys: string[][] = [[entityName]];

		if (id) {
			keys.push([entityName, "single", id]);
			keys.push([entityName, "detail", id]);
		}

		return keys;
	},
};

/**
 * Type guards for query key validation
 */
export const QueryKeyGuards = {
	/**
	 * Type guard to check if object is a valid query key
	 */
	isQueryKey(key: any): key is readonly string[] {
		return Array.isArray(key) && key.every((item) => typeof item === "string");
	},

	/**
	 * Type guard to check if query key matches pattern
	 */
	matchesPattern(key: readonly string[], pattern: readonly string[]): boolean {
		if (key.length < pattern.length) return false;
		return pattern.every((part, index) => key[index] === part);
	},
};

/**
 * Default export for convenience
 */
export default queryKeys;
