/**
 * Advanced data prioritization system for intelligent cache management
 * Manages which data to keep in cache based on importance, usage patterns, and memory constraints
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Data priority levels for cache management
 */
export const DATA_PRIORITIES = {
	// Critical data - never evict (user session, auth)
	CRITICAL: 5,
	// High priority - user frequently accessed (profiles, messages)
	HIGH: 4,
	// Medium priority - regular usage (services, businesses)
	MEDIUM: 3,
	// Low priority - occasionally accessed (marketplace, forum)
	LOW: 2,
	// Background priority - can be evicted anytime (analytics, stats)
	BACKGROUND: 1,
} as const;

export type DataPriority = keyof typeof DATA_PRIORITIES;

/**
 * Data access patterns for intelligent caching
 */
export const ACCESS_PATTERNS = {
	// Accessed frequently and recently
	HOT: "hot",
	// Accessed frequently but not recently
	WARM: "warm",
	// Accessed occasionally
	COOL: "cool",
	// Rarely accessed
	COLD: "cold",
} as const;

export type AccessPattern = keyof typeof ACCESS_PATTERNS;

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
	// When the data was last accessed
	lastAccessed: number;
	// How many times the data has been accessed
	accessCount: number;
	// Priority level of the data
	priority: DataPriority;
	// Access pattern classification
	pattern: AccessPattern;
	// Size estimate in bytes
	size: number;
	// Whether the data is stale
	isStale: boolean;
	// Custom tags for grouping
	tags: string[];
	// Time-to-live in milliseconds
	ttl: number;
	// Created timestamp
	createdAt: number;
}

/**
 * Prioritization configuration
 */
export interface PrioritizationConfig {
	// Maximum cache size in bytes
	maxCacheSize: number;
	// Maximum number of cache entries
	maxEntries: number;
	// Default TTL for different priorities
	ttlByPriority: Record<DataPriority, number>;
	// Access pattern thresholds
	patternThresholds: {
		hot: { minAccess: number; maxAge: number };
		warm: { minAccess: number; maxAge: number };
		cool: { minAccess: number; maxAge: number };
	};
	// Eviction strategy
	evictionStrategy: "lru" | "priority" | "hybrid";
	// Memory pressure threshold
	memoryPressureThreshold: number;
}

/**
 * Default prioritization configuration
 */
export const DEFAULT_PRIORITIZATION_CONFIG: PrioritizationConfig = {
	maxCacheSize: 50 * 1024 * 1024, // 50MB
	maxEntries: 1000,
	ttlByPriority: {
		CRITICAL: 1000 * 60 * 60 * 24, // 24 hours
		HIGH: 1000 * 60 * 60 * 4, // 4 hours
		MEDIUM: 1000 * 60 * 60, // 1 hour
		LOW: 1000 * 60 * 30, // 30 minutes
		BACKGROUND: 1000 * 60 * 10, // 10 minutes
	},
	patternThresholds: {
		hot: { minAccess: 10, maxAge: 1000 * 60 * 5 }, // 5 minutes
		warm: { minAccess: 5, maxAge: 1000 * 60 * 30 }, // 30 minutes
		cool: { minAccess: 2, maxAge: 1000 * 60 * 60 }, // 1 hour
	},
	evictionStrategy: "hybrid",
	memoryPressureThreshold: 0.8, // 80% of max size
};

/**
 * Data prioritization manager
 */
export class DataPrioritizationManager {
	private queryClient: QueryClient;
	private config: PrioritizationConfig;
	private metadata: Map<string, CacheEntryMetadata> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(
		queryClient: QueryClient,
		config: PrioritizationConfig = DEFAULT_PRIORITIZATION_CONFIG,
	) {
		this.queryClient = queryClient;
		this.config = config;
		this.startCleanupInterval();
	}

	/**
	 * Register data with prioritization metadata
	 */
	registerData(
		queryKey: string[],
		metadata: Omit<
			CacheEntryMetadata,
			"lastAccessed" | "accessCount" | "createdAt"
		>,
	): void {
		const key = JSON.stringify(queryKey);
		const existing = this.metadata.get(key);

		if (existing) {
			// Update existing metadata instead of creating duplicate
			const oldPriority = existing.priority;
			existing.priority = metadata.priority;
			existing.size = metadata.size;
			existing.tags = [...new Set([...existing.tags, ...metadata.tags])];
			existing.ttl = metadata.ttl;
			existing.pattern = metadata.pattern;
			existing.isStale = metadata.isStale;
			existing.lastAccessed = Date.now();

			// Only log if priority actually changed
			if (oldPriority !== metadata.priority) {
				this.logPriorityAction(
					"priority-update",
					key,
					metadata.priority,
					oldPriority,
				);
			}
			return;
		}

		const now = Date.now();

		this.metadata.set(key, {
			...metadata,
			lastAccessed: now,
			accessCount: 1,
			createdAt: now,
		});

		this.logPriorityAction("register", key, metadata.priority);
	}

	/**
	 * Record data access
	 */
	recordAccess(queryKey: string[]): void {
		const key = JSON.stringify(queryKey);
		const existing = this.metadata.get(key);

		if (existing) {
			existing.lastAccessed = Date.now();
			existing.accessCount++;
			this.updateAccessPattern(existing);
		}
	}

	/**
	 * Get metadata for a query key
	 */
	getMetadata(queryKey: string[]): CacheEntryMetadata | undefined {
		return this.metadata.get(JSON.stringify(queryKey));
	}

	/**
	 * Update data priority
	 */
	updatePriority(queryKey: string[], newPriority: DataPriority): void {
		const key = JSON.stringify(queryKey);
		const metadata = this.metadata.get(key);

		if (metadata) {
			const oldPriority = metadata.priority;
			metadata.priority = newPriority;
			this.logPriorityAction("priority-change", key, newPriority, oldPriority);
		}
	}

	/**
	 * Add tags to data
	 */
	addTags(queryKey: string[], tags: string[]): void {
		const key = JSON.stringify(queryKey);
		const metadata = this.metadata.get(key);

		if (metadata) {
			metadata.tags = [...new Set([...metadata.tags, ...tags])];
		}
	}

	/**
	 * Find data by tags
	 */
	findByTags(tags: string[]): string[][] {
		const matchingKeys: string[] = [];

		for (const [key, metadata] of this.metadata.entries()) {
			if (tags.some((tag) => metadata.tags.includes(tag))) {
				matchingKeys.push(key);
			}
		}

		return matchingKeys.map((key) => JSON.parse(key));
	}

	/**
	 * Evict low priority data when memory pressure is detected
	 */
	evictLowPriorityData(): void {
		if (this.shouldEvict()) {
			const candidates = this.getEvictionCandidates();
			const toEvict = candidates.slice(0, Math.ceil(candidates.length * 0.3)); // Evict 30%

			for (const queryKey of toEvict) {
				this.queryClient.removeQueries({ queryKey });
				this.metadata.delete(JSON.stringify(queryKey));
				this.logPriorityAction("evict", JSON.stringify(queryKey), "LOW");
			}
		}
	}

	/**
	 * Clean up expired data
	 */
	cleanupExpiredData(): void {
		const now = Date.now();
		const toRemove: string[] = [];

		for (const [key, metadata] of this.metadata.entries()) {
			if (now - metadata.createdAt > metadata.ttl) {
				toRemove.push(key);
			}
		}

		for (const key of toRemove) {
			this.queryClient.removeQueries({ queryKey: JSON.parse(key) });
			this.metadata.delete(key);
			this.logPriorityAction("cleanup", key, "EXPIRED");
		}
	}

	/**
	 * Get prioritization statistics
	 */
	getStats() {
		const stats = {
			totalEntries: this.metadata.size,
			byPriority: {} as Record<DataPriority, number>,
			byPattern: {} as Record<AccessPattern, number>,
			totalSize: 0,
			averageAccessCount: 0,
			oldestEntry: 0,
			newestEntry: 0,
		};

		let totalAccess = 0;
		let oldest = Number.POSITIVE_INFINITY;
		let newest = 0;

		for (const metadata of this.metadata.values()) {
			// Count by priority
			stats.byPriority[metadata.priority] =
				(stats.byPriority[metadata.priority] || 0) + 1;

			// Count by pattern
			stats.byPattern[metadata.pattern] =
				(stats.byPattern[metadata.pattern] || 0) + 1;

			// Calculate total size
			stats.totalSize += metadata.size;

			// Calculate access stats
			totalAccess += metadata.accessCount;

			// Track age
			oldest = Math.min(oldest, metadata.createdAt);
			newest = Math.max(newest, metadata.createdAt);
		}

		stats.averageAccessCount =
			stats.totalEntries > 0 ? totalAccess / stats.totalEntries : 0;
		stats.oldestEntry = oldest === Number.POSITIVE_INFINITY ? 0 : oldest;
		stats.newestEntry = newest;

		return stats;
	}

	/**
	 * Check if eviction is needed
	 */
	private shouldEvict(): boolean {
		const currentSize = this.getCurrentCacheSize();
		return (
			currentSize >
			this.config.maxCacheSize * this.config.memoryPressureThreshold
		);
	}

	/**
	 * Get current cache size estimate
	 */
	private getCurrentCacheSize(): number {
		let totalSize = 0;
		for (const metadata of this.metadata.values()) {
			totalSize += metadata.size;
		}
		return totalSize;
	}

	/**
	 * Get candidates for eviction
	 */
	private getEvictionCandidates(): string[][] {
		const candidates: Array<{ key: string; metadata: CacheEntryMetadata }> = [];

		for (const [key, metadata] of this.metadata.entries()) {
			if (metadata.priority !== "CRITICAL") {
				candidates.push({ key, metadata });
			}
		}

		// Sort based on eviction strategy
		switch (this.config.evictionStrategy) {
			case "lru":
				candidates.sort(
					(a, b) => a.metadata.lastAccessed - b.metadata.lastAccessed,
				);
				break;
			case "priority":
				candidates.sort(
					(a, b) =>
						DATA_PRIORITIES[a.metadata.priority] -
						DATA_PRIORITIES[b.metadata.priority],
				);
				break;
			case "hybrid":
				candidates.sort((a, b) => {
					const priorityDiff =
						DATA_PRIORITIES[a.metadata.priority] -
						DATA_PRIORITIES[b.metadata.priority];
					if (priorityDiff !== 0) return priorityDiff;
					return a.metadata.lastAccessed - b.metadata.lastAccessed;
				});
				break;
		}

		return candidates.map((c) => JSON.parse(c.key));
	}

	/**
	 * Update access pattern based on usage
	 */
	private updateAccessPattern(metadata: CacheEntryMetadata): void {
		const now = Date.now();
		const age = now - metadata.createdAt;
		const { hot, warm, cool } = this.config.patternThresholds;

		if (metadata.accessCount >= hot.minAccess && age <= hot.maxAge) {
			metadata.pattern = "HOT";
		} else if (metadata.accessCount >= warm.minAccess && age <= warm.maxAge) {
			metadata.pattern = "WARM";
		} else if (metadata.accessCount >= cool.minAccess && age <= cool.maxAge) {
			metadata.pattern = "COOL";
		} else {
			metadata.pattern = "COLD";
		}
	}

	/**
	 * Start cleanup interval
	 */
	private startCleanupInterval(): void {
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupExpiredData();
				this.evictLowPriorityData();
			},
			1000 * 60 * 5,
		); // Run every 5 minutes
	}

	/**
	 * Stop cleanup interval
	 */
	stopCleanupInterval(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}

	/**
	 * Evict data by tags
	 */
	evictByTags(tags: string[]): void {
		const queryKeys = this.findByTags(tags);
		for (const queryKey of queryKeys) {
			this.queryClient.removeQueries({ queryKey });
			this.metadata.delete(JSON.stringify(queryKey));
			this.logPriorityAction(
				"evict-by-tag",
				JSON.stringify(queryKey),
				tags.join(","),
			);
		}
	}

	/**
	 * Log priority actions for debugging
	 */
	private logPriorityAction(
		action: string,
		key: string,
		priority: string,
		oldPriority?: string,
	): void {
		// In development, log priority actions
		if (process.env.NODE_ENV === "development") {
			console.log(`[DataPrioritization] ${action}:`, {
				key: `${key.slice(0, 50)}...`,
				priority,
				oldPriority,
				timestamp: new Date().toISOString(),
			});
		}
	}
}

/**
 * Create data prioritization manager instance
 */
export function createDataPrioritizationManager(
	queryClient: QueryClient,
	config?: PrioritizationConfig,
): DataPrioritizationManager {
	return new DataPrioritizationManager(queryClient, config);
}

/**
 * React hook for data prioritization
 */
export function useDataPrioritization() {
	// This will be implemented in the hooks file
	return {
		registerData: () => {},
		recordAccess: () => {},
		updatePriority: () => {},
		addTags: () => {},
		getStats: () => ({}),
	};
}
