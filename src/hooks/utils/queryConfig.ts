/**
 * Centralized Cache Configuration System
 *
 * Provides performance-optimized cache configurations for different
 * entity types with proper TypeScript typing and fallback logic.
 */

/**
 * Cache configuration interface
 */
export interface CacheConfig {
	/** Time in milliseconds that data is considered fresh */
	staleTime: number;
	/** Time in milliseconds that unused data is kept in cache */
	gcTime: number;
	/** Optional interval to refetch data automatically */
	refetchInterval?: number | false;
	/** Number of retry attempts on failure */
	retry?: boolean | number;
	/** Delay between retry attempts */
	retryDelay?: number;
	/** Whether to refetch on window focus */
	refetchOnWindowFocus?: boolean;
	/** Whether to refetch on reconnect */
	refetchOnReconnect?: boolean;
	/** Whether to refetch on mount */
	refetchOnMount?: boolean | "always";
}

/**
 * Pre-defined cache configurations for different entity types
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
	// Authentication data - relatively fresh, moderate cache time
	auth: {
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 3,
		retryDelay: 1000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	},

	// User profiles - fresh for 2 minutes, moderate cache
	profiles: {
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
		retryDelay: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Services - change frequently, short cache time
	services: {
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 3 * 60 * 1000, // 3 minutes
		retry: 2,
		retryDelay: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Service categories - relatively static, longer cache
	serviceCategories: {
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
		retry: 1,
		retryDelay: 1000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	},

	// Businesses - moderate freshness, important for users
	businesses: {
		staleTime: 90 * 1000, // 1.5 minutes
		gcTime: 4 * 60 * 1000, // 4 minutes
		retry: 2,
		retryDelay: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Marketplace listings - change frequently, short cache
	marketplace: {
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 2 * 60 * 1000, // 2 minutes
		retry: 2,
		retryDelay: 500,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Messages - very fresh, frequent updates
	messages: {
		staleTime: 10 * 1000, // 10 seconds
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchInterval: 2 * 60 * 1000, // 2 minutes
		retry: 3,
		retryDelay: 500,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Conversations - similar to messages
	conversations: {
		staleTime: 15 * 1000, // 15 seconds
		gcTime: 3 * 60 * 1000, // 3 minutes
		refetchInterval: 3 * 60 * 1000, // 3 minutes
		retry: 2,
		retryDelay: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Locations - relatively static, longer cache
	locations: {
		staleTime: 15 * 60 * 1000, // 15 minutes
		gcTime: 60 * 60 * 1000, // 1 hour
		retry: 1,
		retryDelay: 2000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
	},

	// Forums - moderate freshness
	forums: {
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		retryDelay: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Presence data - very fresh, real-time updates
	presence: {
		staleTime: 0, // Always stale
		gcTime: 1 * 60 * 1000, // 1 minute
		refetchInterval: 30 * 1000, // 30 seconds
		retry: 1,
		retryDelay: 500,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},

	// Storage uploads - operation-specific
	storage: {
		staleTime: 0, // Always stale
		gcTime: 30 * 1000, // 30 seconds
		retry: 1,
		retryDelay: 1000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	},

	// Default configuration for unknown entities
	default: {
		staleTime: 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
		retryDelay: 1000,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	},
} as const;

/**
 * Cache configuration manager with fallback logic
 */
export const CacheConfigManager = {
	/**
	 * Get cache configuration for a specific entity
	 */
	getConfig: (entityName: string): CacheConfig =>
		CACHE_CONFIGS[entityName] || CACHE_CONFIGS.default,

	/**
	 * Get cache configuration with custom overrides
	 */
	getConfigWithOverrides: (
		entityName: string,
		overrides: Partial<CacheConfig>,
	): CacheConfig => {
		const baseConfig = CacheConfigManager.getConfig(entityName);
		return { ...baseConfig, ...overrides };
	},

	/**
	 * Create query options from cache configuration
	 */
	createQueryOptions: function (
		entityName: string,
		overrides?: Partial<CacheConfig>,
	): Omit<CacheConfig, "gcTime"> {
		const config = overrides
			? this.getConfigWithOverrides(entityName, overrides)
			: this.getConfig(entityName);

		const { gcTime, ...queryOptions } = config;
		return queryOptions;
	},

	/**
	 * Create mutation options from cache configuration
	 */
	createMutationOptions: function (
		entityName: string,
		overrides?: Partial<CacheConfig>,
	): Pick<CacheConfig, "retry" | "retryDelay"> {
		const config = overrides
			? this.getConfigWithOverrides(entityName, overrides)
			: this.getConfig(entityName);

		return {
			retry: config.retry,
			retryDelay: config.retryDelay,
		};
	},

	/**
	 * Check if entity should use real-time updates
	 */
	isRealtimeEntity: function (entityName: string): boolean {
		const config = this.getConfig(entityName);
		return (
			config.refetchInterval !== undefined &&
			config.refetchInterval !== false &&
			config.refetchInterval > 0
		);
	},

	/**
	 * Get real-time interval for entity
	 */
	getRealtimeInterval: function (entityName: string): number | false {
		const config = this.getConfig(entityName);
		return config.refetchInterval || false;
	},

	/**
	 * Create optimized cache configuration for mobile
	 */
	getMobileConfig: (entityName: string): CacheConfig => {
		const baseConfig = CacheConfigManager.getConfig(entityName);

		// More aggressive caching for mobile to reduce data usage
		return {
			...baseConfig,
			staleTime: baseConfig.staleTime * 1.5,
			gcTime: baseConfig.gcTime * 1.5,
			refetchOnWindowFocus: false, // Disable on mobile to save battery
		};
	},

	/**
	 * Create optimized cache configuration for low-memory devices
	 */
	getLowMemoryConfig: (entityName: string): CacheConfig => {
		const baseConfig = CacheConfigManager.getConfig(entityName);

		// Shorter cache times to save memory
		return {
			...baseConfig,
			staleTime: Math.min(baseConfig.staleTime, 30 * 1000), // Max 30 seconds
			gcTime: Math.min(baseConfig.gcTime, 2 * 60 * 1000), // Max 2 minutes
		};
	},
};

/**
 * Utility functions for cache management
 */
export const CacheUtils = {
	/**
	 * Create a cache key for storing additional metadata
	 */
	createMetaKey(entityName: string, metaType: string): string {
		return `${entityName}_${metaType}`;
	},

	/**
	 * Calculate optimal stale time based on data change frequency
	 */
	calculateStaleTime(changeFrequency: "high" | "medium" | "low"): number {
		switch (changeFrequency) {
			case "high":
				return 10 * 1000; // 10 seconds
			case "medium":
				return 60 * 1000; // 1 minute
			case "low":
				return 5 * 60 * 1000; // 5 minutes
			default:
				return 60 * 1000;
		}
	},

	/**
	 * Calculate optimal garbage collection time based on data importance
	 */
	calculateGcTime(importance: "critical" | "important" | "normal"): number {
		switch (importance) {
			case "critical":
				return 30 * 60 * 1000; // 30 minutes
			case "important":
				return 10 * 60 * 1000; // 10 minutes
			case "normal":
				return 5 * 60 * 1000; // 5 minutes
			default:
				return 5 * 60 * 1000;
		}
	},
};

/**
 * Default export for convenience
 */
export default CacheConfigManager;
