import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { initializeCacheIntegration } from "../lib/queryCacheIntegration";

// Shared retry logic for both queries and mutations
const createRetryFunction =
	(maxRetries: number) =>
	(failureCount: number, error: Error & { code?: string }) => {
		if (error?.code === "PGRST116") return false; // Not found error
		if (error?.code === "PGRST301") return false; // Permission denied
		return failureCount < maxRetries;
	};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Default stale time for general queries
			staleTime: 1000 * 60 * 5, // 5 minutes
			// Default garbage collection time
			gcTime: 1000 * 60 * 60 * 24, // 24 hours (longer for persistence)
			retry: createRetryFunction(3),
			refetchOnWindowFocus: false, // Disable refetch on window focus
			refetchOnReconnect: true, // Refetch on reconnect
		},
		mutations: {
			retry: createRetryFunction(2),
		},
	},
});

// Create a persister for localStorage
const localStoragePersister = createSyncStoragePersister({
	storage: window.localStorage,
	key: "GGV_QUERY_CACHE",
	serialize: (data) => JSON.stringify(data),
	deserialize: (data) => JSON.parse(data),
});

// Persist the query client
persistQueryClient({
	queryClient,
	persister: localStoragePersister,
	maxAge: 1000 * 60 * 60 * 24, // 24 hours
	buster: "1.0.0", // Cache version - increment to invalidate all caches
	dehydrateOptions: {
		shouldDehydrateQuery: (query) => {
			// Only persist queries that are successful and have data
			return query.state.status === "success" && query.state.data !== undefined;
		},
	},
});

interface QueryProviderProps {
	children: ReactNode;
}

function CacheIntegration() {
	useEffect(() => {
		// Initialize cache integration with optimized config
		const integration = initializeCacheIntegration(queryClient, {
			memoryPressureThreshold: 75, // Start cleanup at 75%
			criticalMemoryThreshold: 90, // Aggressive cleanup at 90%
			memoryCheckInterval: 15000, // Check every 15 seconds
			cleanupInterval: 30000, // Cleanup every 30 seconds
		});

		// Enhanced performance monitoring in development
		if (import.meta.env.DEV) {
			const logInterval = setInterval(() => {
				const stats = integration.getMemoryStats();
				const cacheStats = queryClient.getQueryCache().getAll().length;

				console.log("🚀 Cache Performance Stats:", {
					memory: {
						used: `${(stats.used / 1024 / 1024).toFixed(2)}MB`,
						total: `${(stats.total / 1024 / 1024).toFixed(2)}MB`,
						percentage: `${stats.percentage.toFixed(1)}%`,
						pressure: stats.isUnderPressure ? "⚠️ HIGH" : "✅ NORMAL",
					},
					queries: {
						active: cacheStats,
						stale: queryClient
							.getQueryCache()
							.getAll()
							.filter((q) => q.isStale()).length,
					},
					performance: {
						hitRate: "N/A", // Could be implemented with query metrics
						avgResponseTime: "N/A", // Could be implemented with query metrics
					},
				});
			}, 30000); // Log every 30 seconds

			return () => {
				clearInterval(logInterval);
				integration.destroy();
			};
		}

		return () => {
			integration.destroy();
		};
	}, []);

	return null;
}

export function QueryProvider({ children }: QueryProviderProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<CacheIntegration />
			{children}
			{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}

export { queryClient };
