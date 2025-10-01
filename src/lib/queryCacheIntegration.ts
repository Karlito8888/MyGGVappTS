/**
 * QueryCache Integration for Data Prioritization Manager
 * Automatically registers queries with the prioritization system and manages memory pressure
 */

import type { Query, QueryClient } from "@tanstack/react-query";
import {
	type DataPrioritizationManager,
	type DataPriority,
	createDataPrioritizationManager,
} from "./dataPrioritization";

/**
 * Configuration for cache integration
 */
interface CacheIntegrationConfig {
	// Memory pressure thresholds (percentage)
	memoryPressureThreshold: number;
	criticalMemoryThreshold: number;

	// Cleanup intervals (milliseconds)
	memoryCheckInterval: number;
	cleanupInterval: number;

	// Auto-registration patterns
	autoRegisterPatterns: string[];
	excludePatterns: string[];
}

const DEFAULT_CONFIG: CacheIntegrationConfig = {
	memoryPressureThreshold: 80, // Start cleanup at 80% memory usage
	criticalMemoryThreshold: 95, // Aggressive cleanup at 95%
	memoryCheckInterval: 30000, // Check every 30 seconds
	cleanupInterval: 60000, // Cleanup every minute
	autoRegisterPatterns: [
		"profiles",
		"messages",
		"services",
		"businesses",
		"marketplace",
		"forums",
	],
	excludePatterns: ["auth", "health", "ping"],
};

/**
 * QueryCache Integration Manager
 * Bridges TanStack Query Cache with Data Prioritization System
 */
export class QueryCacheIntegration {
	private prioritizationManager: DataPrioritizationManager;
	private queryClient: QueryClient;
	private config: CacheIntegrationConfig;
	private memoryCheckTimer?: NodeJS.Timeout;
	private cleanupTimer?: NodeJS.Timeout;
	public isInitialized = false;

	constructor(
		queryClient: QueryClient,
		config: Partial<CacheIntegrationConfig> = {},
	) {
		this.queryClient = queryClient;
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.prioritizationManager = createDataPrioritizationManager(queryClient);
	}

	/**
	 * Initialize the cache integration
	 */
	initialize(): void {
		if (this.isInitialized) return;

		// Subscribe to query cache events
		this.setupCacheSubscriptions();

		// Start memory monitoring
		this.startMemoryMonitoring();

		// Start periodic cleanup
		this.startPeriodicCleanup();

		// Register existing queries
		this.registerExistingQueries();

		this.isInitialized = true;
		console.log("🔧 QueryCache Integration initialized");
	}

	/**
	 * Setup subscriptions to query cache events
	 */
	private setupCacheSubscriptions(): void {
		const queryCache = this.queryClient.getQueryCache();

		// Subscribe to query additions
		queryCache.subscribe((event) => {
			if (event.type === "added") {
				this.handleQueryAdded(event.query);
			} else if (event.type === "updated") {
				this.handleQueryUpdated(event.query);
			} else if (event.type === "removed") {
				this.handleQueryRemoved(event.query);
			}
		});
	}

	/**
	 * Handle new query being added to cache
	 */
	private handleQueryAdded(query: Query): void {
		const queryKey = query.queryKey as string[];
		const queryKeyString = JSON.stringify(queryKey);

		// Check if query should be auto-registered
		if (this.shouldAutoRegister(queryKeyString)) {
			const data = query.state.data;

			if (data) {
				this.autoRegisterQuery(queryKey, data);
			} else {
				// Register when data becomes available - use query state observer
				const checkData = () => {
					if (query.state.data) {
						this.autoRegisterQuery(queryKey, query.state.data);
					}
				};

				// Set up a simple interval to check for data
				const interval = setInterval(checkData, 100);
				setTimeout(() => clearInterval(interval), 5000); // Stop after 5 seconds
			}
		}
	}

	/**
	 * Handle query updates
	 */
	private handleQueryUpdated(query: Query): void {
		const queryKey = query.queryKey as string[];
		const data = query.state.data;

		if (data) {
			// Record access and update metadata
			this.prioritizationManager.recordAccess(queryKey);

			// Update data size if changed
			const metadata = this.prioritizationManager.getMetadata(queryKey);
			if (metadata) {
				const newSize = this.estimateDataSize(data);
				if (newSize !== metadata.size) {
					metadata.size = newSize;
				}
			}
		}
	}

	/**
	 * Handle query removal from cache
	 */
	private handleQueryRemoved(_query: Query): void {
		// Clean up prioritization metadata by removing from internal map
		// Note: DataPrioritizationManager doesn't have removeMetadata method
		// The metadata will be cleaned up during periodic cleanup
	}

	/**
	 * Check if query should be auto-registered
	 */
	private shouldAutoRegister(queryKeyString: string): boolean {
		// Check exclude patterns first
		for (const pattern of this.config.excludePatterns) {
			if (queryKeyString.includes(pattern)) {
				return false;
			}
		}

		// Check include patterns
		for (const pattern of this.config.autoRegisterPatterns) {
			if (queryKeyString.includes(pattern)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Auto-register query with prioritization system
	 */
	private autoRegisterQuery(queryKey: string[], data: unknown): void {
		const queryKeyString = JSON.stringify(queryKey);
		const { priority, tags } = this.determineQueryPriority(queryKeyString);
		const size = this.estimateDataSize(data);

		this.prioritizationManager.registerData(queryKey, {
			priority,
			size,
			tags,
			ttl: this.getDefaultTtl(priority),
			pattern: "COOL",
			isStale: false,
		});
	}

	/**
	 * Determine query priority based on key patterns
	 */
	private determineQueryPriority(queryKeyString: string): {
		priority: DataPriority;
		tags: string[];
	} {
		let priority: DataPriority = "MEDIUM";
		const tags: string[] = [];

		if (queryKeyString.includes("profiles")) {
			priority = "HIGH";
			tags.push("user-data", "profiles");
		} else if (queryKeyString.includes("messages")) {
			priority = "CRITICAL";
			tags.push("user-data", "messages", "realtime");
		} else if (queryKeyString.includes("auth")) {
			priority = "CRITICAL";
			tags.push("auth", "session");
		} else if (queryKeyString.includes("services")) {
			priority = "MEDIUM";
			tags.push("business-data", "services");
		} else if (queryKeyString.includes("businesses")) {
			priority = "MEDIUM";
			tags.push("business-data", "businesses");
		} else if (queryKeyString.includes("marketplace")) {
			priority = "LOW";
			tags.push("marketplace", "products");
		} else if (queryKeyString.includes("forums")) {
			priority = "LOW";
			tags.push("community", "forums");
		}

		return { priority, tags };
	}

	/**
	 * Get default TTL based on priority
	 */
	private getDefaultTtl(priority: DataPriority): number {
		const ttlMap: Record<DataPriority, number> = {
			CRITICAL: 1000 * 60 * 30, // 30 minutes
			HIGH: 1000 * 60 * 15, // 15 minutes
			MEDIUM: 1000 * 60 * 10, // 10 minutes
			LOW: 1000 * 60 * 5, // 5 minutes
			BACKGROUND: 1000 * 60 * 2, // 2 minutes
		};

		return ttlMap[priority];
	}

	/**
	 * Estimate data size
	 */
	private estimateDataSize(data: unknown): number {
		try {
			const jsonString = JSON.stringify(data);
			return new Blob([jsonString]).size;
		} catch {
			return 1024; // 1KB default
		}
	}

	/**
	 * Register existing queries in cache
	 */
	private registerExistingQueries(): void {
		const queryCache = this.queryClient.getQueryCache();
		const queries = queryCache.getAll();

		for (const query of queries) {
			if (query.state.data) {
				this.handleQueryAdded(query);
			}
		}
	}

	/**
	 * Start memory monitoring
	 */
	private startMemoryMonitoring(): void {
		this.memoryCheckTimer = setInterval(() => {
			this.checkMemoryPressure();
		}, this.config.memoryCheckInterval);
	}

	/**
	 * Check memory pressure and trigger cleanup if needed
	 */
	private checkMemoryPressure(): void {
		const stats = this.prioritizationManager.getStats();
		const maxCacheSize = 50 * 1024 * 1024; // 50MB default
		const memoryUsage = (stats.totalSize / maxCacheSize) * 100;

		if (memoryUsage >= this.config.criticalMemoryThreshold) {
			console.warn(
				"🚨 Critical memory pressure detected, triggering aggressive cleanup",
			);
			this.aggressiveCleanup();
		} else if (memoryUsage >= this.config.memoryPressureThreshold) {
			console.log("⚠️ Memory pressure detected, triggering cleanup");
			this.gentleCleanup();
		}
	}

	/**
	 * Gentle cleanup - remove low priority and expired data
	 */
	private gentleCleanup(): void {
		this.prioritizationManager.evictLowPriorityData();
		this.prioritizationManager.cleanupExpiredData();
	}

	/**
	 * Aggressive cleanup - remove more data aggressively
	 */
	private aggressiveCleanup(): void {
		// Evict low and medium priority data
		const mediumPriorityQueries = this.prioritizationManager.findByTags([
			"medium",
		]);
		const toEvict = Math.floor(mediumPriorityQueries.length * 0.5); // Remove 50%

		for (let i = 0; i < toEvict; i++) {
			const queryKey = mediumPriorityQueries[i];
			this.prioritizationManager.updatePriority(queryKey, "LOW");
		}

		// Final cleanup
		this.prioritizationManager.evictLowPriorityData();
		this.prioritizationManager.cleanupExpiredData();
	}

	/**
	 * Start periodic cleanup
	 */
	private startPeriodicCleanup(): void {
		this.cleanupTimer = setInterval(() => {
			this.prioritizationManager.cleanupExpiredData();
		}, this.config.cleanupInterval);
	}

	/**
	 * Get prioritization manager instance
	 */
	getPrioritizationManager(): DataPrioritizationManager {
		return this.prioritizationManager;
	}

	/**
	 * Get memory usage statistics
	 */
	getMemoryStats(): {
		used: number;
		total: number;
		percentage: number;
		isUnderPressure: boolean;
		queryCount: number;
	} {
		const stats = this.prioritizationManager.getStats();
		const maxCacheSize = 50 * 1024 * 1024; // 50MB
		const percentage = (stats.totalSize / maxCacheSize) * 100;

		return {
			used: stats.totalSize,
			total: maxCacheSize,
			percentage,
			isUnderPressure: percentage >= this.config.memoryPressureThreshold,
			queryCount: stats.totalEntries,
		};
	}

	/**
	 * Force immediate cleanup
	 */
	forceCleanup(): void {
		this.aggressiveCleanup();
	}

	/**
	 * Cleanup and destroy integration
	 */
	destroy(): void {
		if (this.memoryCheckTimer) {
			clearInterval(this.memoryCheckTimer);
		}

		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
		}

		this.isInitialized = false;
		console.log("🔧 QueryCache Integration destroyed");
	}
}

/**
 * Global integration instance
 */
let globalIntegration: QueryCacheIntegration | null = null;

/**
 * Initialize cache integration with query client
 */
export function initializeCacheIntegration(
	queryClient: QueryClient,
	config?: Partial<CacheIntegrationConfig>,
): QueryCacheIntegration {
	// Only initialize if not already initialized
	if (globalIntegration?.isInitialized) {
		console.log("🔧 QueryCache Integration already initialized, skipping");
		return globalIntegration;
	}

	// Clean up existing instance if it exists but isn't properly initialized
	if (globalIntegration) {
		globalIntegration.destroy();
	}

	globalIntegration = new QueryCacheIntegration(queryClient, config);
	globalIntegration.initialize();

	return globalIntegration;
}

/**
 * Get global cache integration instance
 */
export function getCacheIntegration(): QueryCacheIntegration | null {
	return globalIntegration;
}
