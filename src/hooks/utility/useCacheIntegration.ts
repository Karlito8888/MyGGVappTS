/**
 * React hooks for Cache Integration functionality
 * Provides access to cache management and memory statistics
 */

import { useCallback } from "react";
import {
	type QueryCacheIntegration,
	getCacheIntegration,
} from "../../lib/queryCacheIntegration";

/**
 * Hook for accessing cache integration functionality
 */
export function useCacheIntegration(): QueryCacheIntegration | null {
	// Get the global integration instance
	return getCacheIntegration();
}

/**
 * Hook for memory statistics and monitoring
 */
export function useCacheMemoryStats() {
	const integration = useCacheIntegration();

	const getMemoryStats = useCallback(() => {
		if (!integration) {
			return {
				used: 0,
				total: 0,
				percentage: 0,
				isUnderPressure: false,
				queryCount: 0,
			};
		}

		return integration.getMemoryStats();
	}, [integration]);

	const forceCleanup = useCallback(() => {
		if (integration) {
			integration.forceCleanup();
		}
	}, [integration]);

	const getPrioritizationManager = useCallback(() => {
		if (!integration) {
			return null;
		}

		return integration.getPrioritizationManager();
	}, [integration]);

	return {
		getMemoryStats,
		forceCleanup,
		getPrioritizationManager,
		isAvailable: !!integration,
	};
}

/**
 * Hook for cache debugging in development
 */
export function useCacheDebug() {
	const { getMemoryStats, forceCleanup, isAvailable } = useCacheMemoryStats();

	const logCacheState = useCallback(() => {
		if (!isAvailable || !import.meta.env.DEV) {
			return;
		}

		const stats = getMemoryStats();
		const manager = getCacheIntegration()?.getPrioritizationManager();

		console.group("🔍 Cache Debug Information");
		console.log("📊 Memory Stats:", {
			used: `${(stats.used / 1024 / 1024).toFixed(2)}MB`,
			total: `${(stats.total / 1024 / 1024).toFixed(2)}MB`,
			percentage: `${stats.percentage.toFixed(1)}%`,
			queries: stats.queryCount,
			pressure: stats.isUnderPressure ? "⚠️ UNDER PRESSURE" : "✅ Normal",
		});

		if (manager) {
			const detailedStats = manager.getStats();
			console.log("📈 Detailed Stats:", detailedStats);

			console.log("🎯 Priority Distribution:");
			for (const [priority, count] of Object.entries(
				detailedStats.byPriority,
			)) {
				const percentage =
					detailedStats.totalEntries > 0
						? ((count / detailedStats.totalEntries) * 100).toFixed(1)
						: "0.0";
				console.log(`  ${priority}: ${count} queries (${percentage}%)`);
			}

			console.log("🔥 Access Pattern Distribution:");
			for (const [pattern, count] of Object.entries(detailedStats.byPattern)) {
				const percentage =
					detailedStats.totalEntries > 0
						? ((count / detailedStats.totalEntries) * 100).toFixed(1)
						: "0.0";
				console.log(`  ${pattern}: ${count} queries (${percentage}%)`);
			}

			console.log("🔥 Access Pattern Distribution:");
			for (const [pattern, count] of Object.entries(detailedStats.byPattern)) {
				const percentage =
					detailedStats.totalEntries > 0
						? ((count / detailedStats.totalEntries) * 100).toFixed(1)
						: "0.0";
				console.log(`  ${pattern}: ${count} queries (${percentage}%)`);
			}
		}

		console.groupEnd();
	}, [getMemoryStats, isAvailable]);

	const clearLowPriorityData = useCallback(() => {
		if (!isAvailable) return;

		const manager = getCacheIntegration()?.getPrioritizationManager();
		if (manager) {
			console.log("🧹 Clearing low priority data...");
			manager.evictLowPriorityData();
			setTimeout(logCacheState, 1000); // Log after cleanup
		}
	}, [isAvailable, logCacheState]);

	return {
		logCacheState,
		forceCleanup,
		clearLowPriorityData,
		isAvailable: isAvailable && import.meta.env.DEV,
	};
}

/**
 * Hook for cache optimization actions
 */
export function useCacheOptimization() {
	const integration = useCacheIntegration();

	const optimizeForNavigation = useCallback(() => {
		if (!integration) return;

		const manager = integration.getPrioritizationManager();

		// Elevate priority of user-related data during navigation
		const userDataQueries = manager.findByTags(["user-data"]);
		for (const queryKey of userDataQueries) {
			manager.updatePriority(queryKey, "HIGH");
		}

		console.log("🚀 Optimized cache for navigation");
	}, [integration]);

	const optimizeForRealtime = useCallback(() => {
		if (!integration) return;

		const manager = integration.getPrioritizationManager();

		// Elevate priority of realtime data
		const realtimeQueries = manager.findByTags(["realtime"]);
		for (const queryKey of realtimeQueries) {
			manager.updatePriority(queryKey, "CRITICAL");
		}

		console.log("⚡ Optimized cache for realtime updates");
	}, [integration]);

	const optimizeForBackground = useCallback(() => {
		if (!integration) return;

		const manager = integration.getPrioritizationManager();

		// Lower priority of non-essential data
		const businessDataQueries = manager.findByTags(["business-data"]);
		for (const queryKey of businessDataQueries) {
			manager.updatePriority(queryKey, "LOW");
		}

		const marketplaceQueries = manager.findByTags(["marketplace"]);
		for (const queryKey of marketplaceQueries) {
			manager.updatePriority(queryKey, "BACKGROUND");
		}

		console.log("🌙 Optimized cache for background mode");
	}, [integration]);

	return {
		optimizeForNavigation,
		optimizeForRealtime,
		optimizeForBackground,
		isAvailable: !!integration,
	};
}
