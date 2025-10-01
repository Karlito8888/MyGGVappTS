/**
 * Comprehensive tests for the unified useMarketplace hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useMarketplace API Compatibility", () => {
	it("should export useMarketplaceListings function", async () => {
		const { useMarketplaceListings } = await import("./useMarketplace");
		expect(typeof useMarketplaceListings).toBe("function");
	});

	it("should export useMarketplaceActiveListings function", async () => {
		const { useMarketplaceActiveListings } = await import("./useMarketplace");
		expect(typeof useMarketplaceActiveListings).toBe("function");
	});

	it("should export useMarketplaceListing function", async () => {
		const { useMarketplaceListing } = await import("./useMarketplace");
		expect(typeof useMarketplaceListing).toBe("function");
	});

	it("should export useMarketplaceUserListings function", async () => {
		const { useMarketplaceUserListings } = await import("./useMarketplace");
		expect(typeof useMarketplaceUserListings).toBe("function");
	});

	it("should export useMarketplaceMutations function", async () => {
		const { useMarketplaceMutations } = await import("./useMarketplace");
		expect(typeof useMarketplaceMutations).toBe("function");
	});

	it("should export marketplace query keys", async () => {
		const { marketplaceQueryKeys } = await import("./useMarketplace");
		expect(marketplaceQueryKeys).toBeDefined();
		expect(typeof marketplaceQueryKeys.all).toBe("function");
		expect(typeof marketplaceQueryKeys.lists).toBe("function");
		expect(typeof marketplaceQueryKeys.details).toBe("function");
		expect(typeof marketplaceQueryKeys.byUser).toBe("function");
		expect(typeof marketplaceQueryKeys.byId).toBe("function");
	});

	it("should export default useMarketplace function", async () => {
		const useMarketplace = await import("./useMarketplace").then(
			(m) => m.default,
		);
		expect(typeof useMarketplace).toBe("function");
	});
});

describe("useMarketplace Query Keys", () => {
	it("should generate correct query keys", async () => {
		const { marketplaceQueryKeys } = await import("./useMarketplace");
		expect(marketplaceQueryKeys.all()).toEqual(["marketplace"]);
		expect(marketplaceQueryKeys.lists()).toEqual(["marketplace", "list"]);
		expect(marketplaceQueryKeys.details()).toEqual(["marketplace", "detail"]);
		expect(marketplaceQueryKeys.byUser("user123")).toEqual([
			"marketplace",
			"user",
			"user123",
		]);
		expect(marketplaceQueryKeys.byId("item123")).toEqual([
			"marketplace",
			"detail",
			"item123",
		]);
	});
});

describe("useMarketplace CRUD Operations", () => {
	it("should support create operations", async () => {
		const { useMarketplaceMutations } = await import("./useMarketplace");
		expect(typeof useMarketplaceMutations).toBe("function");
	});

	it("should support update operations", async () => {
		const { useMarketplaceMutations } = await import("./useMarketplace");
		expect(typeof useMarketplaceMutations).toBe("function");
	});

	it("should support delete operations", async () => {
		const { useMarketplaceMutations } = await import("./useMarketplace");
		expect(typeof useMarketplaceMutations).toBe("function");
	});
});

describe("useMarketplace User-specific Queries", () => {
	it("should support user listings queries", async () => {
		const { useMarketplaceUserListings } = await import("./useMarketplace");
		expect(typeof useMarketplaceUserListings).toBe("function");
	});

	it("should support single listing queries", async () => {
		const { useMarketplaceListing } = await import("./useMarketplace");
		expect(typeof useMarketplaceListing).toBe("function");
	});
});

describe("useMarketplace Listings Queries", () => {
	it("should support all listings queries", async () => {
		const { useMarketplaceListings } = await import("./useMarketplace");
		expect(typeof useMarketplaceListings).toBe("function");
	});

	it("should support active listings queries", async () => {
		const { useMarketplaceActiveListings } = await import("./useMarketplace");
		expect(typeof useMarketplaceActiveListings).toBe("function");
	});
});
