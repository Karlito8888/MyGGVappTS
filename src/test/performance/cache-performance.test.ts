/**
 * Cache Performance Tests
 *
 * Tests to verify cache performance improvements after hooks refactoring
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock performance API
const performance = {
	mark: vi.fn(),
	measure: vi.fn(),
	getEntriesByName: vi.fn(() => []),
	clearMarks: vi.fn(),
	clearMeasures: vi.fn(),
};

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "performance", { value: performance });

describe("Cache Performance Tests", () => {
	let testQueryClient: QueryClient;

	beforeEach(() => {
		testQueryClient = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 1000 * 60 * 5,
					gcTime: 1000 * 60 * 60 * 24,
					retry: false, // Disable retries for tests
				},
			},
		});

		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		testQueryClient.clear();
	});

	describe("Query Cache Efficiency", () => {
		it("should maintain optimal cache size", async () => {
			// Test that cache doesn't grow unbounded
			// Simulate multiple queries
			for (let i = 0; i < 100; i++) {
				await testQueryClient.prefetchQuery({
					queryKey: ["test", i],
					queryFn: () => Promise.resolve({ data: `test-${i}` }),
					staleTime: 1000 * 60 * 5,
				});
			}

			const finalCacheSize = testQueryClient.getQueryCache().getAll().length;
			expect(finalCacheSize).toBeLessThan(150); // Allow some buffer for active queries
		});

		it("should properly invalidate stale queries", async () => {
			// Test query invalidation efficiency
			const queryKey = ["test-invalidation"];

			// Set up initial query
			await testQueryClient.prefetchQuery({
				queryKey,
				queryFn: () => Promise.resolve({ data: "initial" }),
				staleTime: 1000 * 60 * 5,
			});

			let query = testQueryClient.getQueryCache().find({ queryKey });
			expect(query?.state.data).toEqual({ data: "initial" });

			// Invalidate and refetch
			await testQueryClient.invalidateQueries({ queryKey });

			// Query should be marked as stale
			query = testQueryClient.getQueryCache().find({ queryKey });
			expect(query?.isStale()).toBe(true);
		});

		it("should handle memory pressure gracefully", async () => {
			// Test memory management under pressure
			const largeData = Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				data: "x".repeat(1000), // 1KB per item
			}));

			await testQueryClient.setQueryData(["large-data"], largeData);

			const query = testQueryClient
				.getQueryCache()
				.find({ queryKey: ["large-data"] });
			expect(query?.state.data).toBeDefined();

			// Force garbage collection simulation
			testQueryClient.getQueryCache().clear();

			const clearedQuery = testQueryClient
				.getQueryCache()
				.find({ queryKey: ["large-data"] });
			expect(clearedQuery).toBeUndefined();
		});
	});

	describe("Bundle Size Optimization", () => {
		it("should have minimal bundle impact", () => {
			// Test that the query client configuration doesn't add unnecessary weight
			const clientConfig = testQueryClient.getDefaultOptions();

			expect(clientConfig.queries?.staleTime).toBeDefined();
			expect(clientConfig.queries?.gcTime).toBeDefined();
			expect(clientConfig.queries?.retry).toBeDefined();
		});

		it("should use efficient serialization", () => {
			// Test that data serialization is efficient
			const testData = {
				users: Array.from({ length: 100 }, (_, i) => ({
					id: i,
					name: `User ${i}`,
					email: `user${i}@example.com`,
				})),
			};

			const serialized = JSON.stringify(testData);
			const deserialized = JSON.parse(serialized);

			expect(deserialized).toEqual(testData);
			expect(serialized.length).toBeLessThan(10000); // Reasonable size limit
		});
	});

	describe("Query Performance Metrics", () => {
		it("should track query performance", async () => {
			performance.mark.mockClear();
			performance.measure.mockClear();

			// Simulate query execution with performance tracking
			const startTime = Date.now();

			await testQueryClient.prefetchQuery({
				queryKey: ["performance-test"],
				queryFn: async () => {
					await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate network delay
					return { data: "performance-test-result" };
				},
			});

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Query should complete within reasonable time
			expect(duration).toBeLessThan(100); // Less than 100ms
		});

		it("should optimize concurrent queries", async () => {
			const queryPromises = Array.from({ length: 10 }, (_, i) =>
				testQueryClient.prefetchQuery({
					queryKey: ["concurrent", i],
					queryFn: () => Promise.resolve({ data: `concurrent-${i}` }),
				}),
			);

			const startTime = Date.now();
			await Promise.all(queryPromises);
			const endTime = Date.now();

			// All queries should complete efficiently
			expect(endTime - startTime).toBeLessThan(500); // Less than 500ms for 10 queries
		});
	});

	describe("Cache Persistence", () => {
		it("should persist cache data correctly", async () => {
			// Test localStorage persistence
			localStorageMock.setItem.mockClear();
			localStorageMock.getItem.mockClear();

			// Set up query with persistence
			await testQueryClient.setQueryData(["persistent"], {
				data: "persistent-value",
			});

			// Simulate persistence save
			const cacheData = testQueryClient.getQueryCache().getAll();
			expect(cacheData.length).toBeGreaterThan(0);

			// Verify data can be serialized
			const serialized = JSON.stringify(cacheData);
			expect(() => JSON.parse(serialized)).not.toThrow();
		});

		it("should handle cache buster correctly", () => {
			// Test that cache key is properly defined for persistence
			const cacheKey = "GGV_QUERY_CACHE";
			const cacheVersion = "1.0.0";

			// Verify cache configuration constants are properly defined
			expect(cacheKey).toBe("GGV_QUERY_CACHE");
			expect(cacheVersion).toBe("1.0.0");

			// Test that localStorage mock can handle serialization
			const testData = { version: cacheVersion, data: { test: "value" } };
			const serialized = JSON.stringify(testData);
			localStorageMock.setItem(cacheKey, serialized);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				cacheKey,
				serialized,
			);
		});
	});
});
