/**
 * React hooks for data prioritization
 * Provides easy-to-use hooks for intelligent cache management and data prioritization
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import type {
	DataPrioritizationManager,
	DataPriority,
} from "../../lib/dataPrioritization";
import {
	DATA_PRIORITIES,
	DEFAULT_PRIORITIZATION_CONFIG,
	createDataPrioritizationManager,
} from "../../lib/dataPrioritization";

/**
 * Global data prioritization manager instance
 */
let globalPrioritizationManager: DataPrioritizationManager | null = null;

/**
 * Hook for accessing the data prioritization manager
 */
export function useDataPrioritizationManager(): DataPrioritizationManager {
	const queryClient = useQueryClient();

	if (!globalPrioritizationManager) {
		globalPrioritizationManager = createDataPrioritizationManager(queryClient);
	}

	return globalPrioritizationManager;
}

/**
 * Hook for registering data with prioritization metadata
 * Automatically registers data when it's fetched
 */
export function useDataRegistration<T = unknown>(
	queryKey: string[],
	data: T | undefined,
	options: {
		priority: DataPriority;
		size?: number;
		tags?: string[];
		ttl?: number;
	},
) {
	const prioritizationManager = useDataPrioritizationManager();

	useEffect(() => {
		if (data) {
			const size = options.size || estimateDataSize(data);
			const ttl =
				options.ttl ||
				DEFAULT_PRIORITIZATION_CONFIG.ttlByPriority[options.priority];

			prioritizationManager.registerData(queryKey, {
				priority: options.priority,
				size,
				tags: options.tags || [],
				ttl,
				pattern: "COOL", // Start with cool pattern
				isStale: false,
			});
		}
	}, [data, queryKey, options, prioritizationManager]);
}

/**
 * Hook for tracking data access
 * Automatically records when data is accessed
 */
export function useDataAccessTracking(queryKey: string[]) {
	const prioritizationManager = useDataPrioritizationManager();

	const recordAccess = useCallback(() => {
		prioritizationManager.recordAccess(queryKey);
	}, [queryKey, prioritizationManager]);

	return { recordAccess };
}

/**
 * Hook for priority management
 * Allows dynamic priority updates based on user context
 */
export function usePriorityManagement(
	queryKey: string[],
	initialPriority: DataPriority,
) {
	const prioritizationManager = useDataPrioritizationManager();

	const updatePriority = useCallback(
		(newPriority: DataPriority) => {
			prioritizationManager.updatePriority(queryKey, newPriority);
		},
		[queryKey, prioritizationManager],
	);

	const elevatePriority = useCallback(() => {
		const currentPriority =
			prioritizationManager.getMetadata(queryKey)?.priority || initialPriority;
		const currentLevel = DATA_PRIORITIES[currentPriority];
		const maxLevel = Math.max(...Object.values(DATA_PRIORITIES));

		if (currentLevel < maxLevel) {
			// Find next higher priority
			const nextPriority = Object.entries(DATA_PRIORITIES).find(
				([_, level]) => level === currentLevel + 1,
			)?.[0] as DataPriority;

			if (nextPriority) {
				updatePriority(nextPriority);
			}
		}
	}, [queryKey, initialPriority, prioritizationManager, updatePriority]);

	const lowerPriority = useCallback(() => {
		const currentPriority =
			prioritizationManager.getMetadata(queryKey)?.priority || initialPriority;
		const currentLevel = DATA_PRIORITIES[currentPriority];
		const minLevel = Math.min(...Object.values(DATA_PRIORITIES));

		if (currentLevel > minLevel) {
			// Find next lower priority
			const nextPriority = Object.entries(DATA_PRIORITIES)
				.reverse()
				.find(([_, level]) => level === currentLevel - 1)?.[0] as DataPriority;

			if (nextPriority) {
				updatePriority(nextPriority);
			}
		}
	}, [queryKey, initialPriority, prioritizationManager, updatePriority]);

	return {
		updatePriority,
		elevatePriority,
		lowerPriority,
		currentPriority:
			prioritizationManager.getMetadata(queryKey)?.priority || initialPriority,
	};
}

/**
 * Hook for tag management
 * Allows grouping related data for bulk operations
 */
export function useTagManagement(queryKey: string[]) {
	const prioritizationManager = useDataPrioritizationManager();

	const addTags = useCallback(
		(tags: string[]) => {
			prioritizationManager.addTags(queryKey, tags);
		},
		[queryKey, prioritizationManager],
	);

	const removeTags = useCallback(
		(tags: string[]) => {
			const metadata = prioritizationManager.getMetadata(queryKey);
			if (metadata) {
				metadata.tags = metadata.tags.filter((tag) => !tags.includes(tag));
			}
		},
		[queryKey, prioritizationManager],
	);

	const clearTags = useCallback(() => {
		const metadata = prioritizationManager.getMetadata(queryKey);
		if (metadata) {
			metadata.tags = [];
		}
	}, [queryKey, prioritizationManager]);

	const getTags = useCallback(() => {
		return prioritizationManager.getMetadata(queryKey)?.tags || [];
	}, [queryKey, prioritizationManager]);

	return {
		addTags,
		removeTags,
		clearTags,
		getTags,
	};
}

/**
 * Hook for bulk operations by tags
 * Allows managing multiple data entries by tags
 */
export function useBulkTagOperations() {
	const prioritizationManager = useDataPrioritizationManager();

	const elevateByTag = useCallback(
		(tag: string) => {
			const queryKeys = prioritizationManager.findByTags([tag]);
			for (const queryKey of queryKeys) {
				prioritizationManager.updatePriority(queryKey, "HIGH");
			}
		},
		[prioritizationManager],
	);

	const evictByTag = useCallback(
		(tag: string) => {
			prioritizationManager.evictByTags([tag]);
		},
		[prioritizationManager],
	);

	const getByTag = useCallback(
		(tag: string) => {
			return prioritizationManager.findByTags([tag]);
		},
		[prioritizationManager],
	);

	return {
		elevateByTag,
		evictByTag,
		getByTag,
	};
}

/**
 * Hook for prioritization statistics
 * Provides insights into cache performance and usage patterns
 */
export function usePrioritizationStats() {
	const prioritizationManager = useDataPrioritizationManager();

	const getStats = useCallback(() => {
		return prioritizationManager.getStats();
	}, [prioritizationManager]);

	const getMemoryUsage = useCallback(() => {
		const stats = prioritizationManager.getStats();
		const maxSize = DEFAULT_PRIORITIZATION_CONFIG.maxCacheSize;
		return {
			used: stats.totalSize,
			total: maxSize,
			percentage: (stats.totalSize / maxSize) * 100,
			isUnderPressure:
				stats.totalSize >
				maxSize * DEFAULT_PRIORITIZATION_CONFIG.memoryPressureThreshold,
		};
	}, [prioritizationManager]);

	const getPriorityDistribution = useCallback(() => {
		const stats = prioritizationManager.getStats();
		const total = stats.totalEntries;

		return Object.entries(stats.byPriority).map(([priority, count]) => ({
			priority,
			count,
			percentage: total > 0 ? (count / total) * 100 : 0,
		}));
	}, [prioritizationManager]);

	const getPatternDistribution = useCallback(() => {
		const stats = prioritizationManager.getStats();
		const total = stats.totalEntries;

		return Object.entries(stats.byPattern).map(([pattern, count]) => ({
			pattern,
			count,
			percentage: total > 0 ? (count / total) * 100 : 0,
		}));
	}, [prioritizationManager]);

	return {
		getStats,
		getMemoryUsage,
		getPriorityDistribution,
		getPatternDistribution,
	};
}

/**
 * Hook for smart data registration
 * Automatically determines priority and tags based on query key patterns
 */
export function useSmartDataRegistration<T = unknown>(
	queryKey: string[],
	data: T | undefined,
) {
	const smartConfig = useMemo(() => {
		const keyString = JSON.stringify(queryKey);

		// Determine priority based on query key patterns
		let priority: DataPriority = "MEDIUM";
		let tags: string[] = [];
		let size = 0;

		if (keyString.includes("profiles")) {
			priority = "HIGH";
			tags = ["user-data", "profiles"];
		} else if (keyString.includes("messages")) {
			priority = "CRITICAL";
			tags = ["user-data", "messages", "realtime"];
		} else if (keyString.includes("services")) {
			priority = "MEDIUM";
			tags = ["business-data", "services"];
		} else if (keyString.includes("businesses")) {
			priority = "MEDIUM";
			tags = ["business-data", "businesses"];
		} else if (keyString.includes("marketplace")) {
			priority = "LOW";
			tags = ["marketplace", "products"];
		} else if (keyString.includes("auth")) {
			priority = "CRITICAL";
			tags = ["auth", "session"];
		}

		// Estimate size if data is available
		if (data) {
			size = estimateDataSize(data);
		}

		return { priority, tags, size };
	}, [queryKey, data]);

	useDataRegistration(queryKey, data, smartConfig);

	return {
		priority: smartConfig.priority,
		tags: smartConfig.tags,
		size: smartConfig.size,
	};
}

/**
 * Hook for context-aware priority adjustment
 * Adjusts data priority based on user context and actions
 */
export function useContextAwarePriority(
	queryKey: string[],
	basePriority: DataPriority,
) {
	const { updatePriority } = usePriorityManagement(queryKey, basePriority);

	const elevateOnUserAction = useCallback(() => {
		updatePriority("HIGH");
		// Auto-lower after 5 minutes of inactivity
		setTimeout(
			() => {
				updatePriority(basePriority);
			},
			1000 * 60 * 5,
		);
	}, [updatePriority, basePriority]);

	const elevateOnNavigation = useCallback(() => {
		updatePriority("CRITICAL");
		// Auto-lower after 2 minutes
		setTimeout(
			() => {
				updatePriority("HIGH");
			},
			1000 * 60 * 2,
		);
	}, [updatePriority]);

	const elevateOnRealtimeUpdate = useCallback(() => {
		updatePriority("CRITICAL");
		// Auto-lower after 1 minute
		setTimeout(() => {
			updatePriority("HIGH");
		}, 1000 * 60);
	}, [updatePriority]);

	return {
		elevateOnUserAction,
		elevateOnNavigation,
		elevateOnRealtimeUpdate,
	};
}

/**
 * Hook for cache optimization
 * Provides utilities for optimizing cache performance
 */
export function useCacheOptimization() {
	const prioritizationManager = useDataPrioritizationManager();

	const optimizeCache = useCallback(() => {
		prioritizationManager.evictLowPriorityData();
		prioritizationManager.cleanupExpiredData();
	}, [prioritizationManager]);

	const clearLowPriorityData = useCallback(() => {
		const stats = prioritizationManager.getStats();

		// Clear all LOW and BACKGROUND priority data
		const lowPriorityKeys = Object.entries(stats.byPriority)
			.filter(([priority]) => priority === "LOW" || priority === "BACKGROUND")
			.flatMap(([priority]) => {
				return prioritizationManager.findByTags([priority.toLowerCase()]);
			});

		// Use the existing evict method which handles queryClient access internally
		for (const queryKey of lowPriorityKeys) {
			prioritizationManager.updatePriority(queryKey, "BACKGROUND");
		}
		// Trigger eviction to remove the background priority data
		prioritizationManager.evictLowPriorityData();
	}, [prioritizationManager]);

	const forceCleanup = useCallback(() => {
		prioritizationManager.cleanupExpiredData();
	}, [prioritizationManager]);

	return {
		optimizeCache,
		clearLowPriorityData,
		forceCleanup,
	};
}

/**
 * Utility function to estimate data size
 */
function estimateDataSize(data: unknown): number {
	try {
		const jsonString = JSON.stringify(data);
		return new Blob([jsonString]).size;
	} catch {
		// Fallback estimate
		return 1024; // 1KB default estimate
	}
}
