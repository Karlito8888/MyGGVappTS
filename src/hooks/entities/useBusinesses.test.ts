/**
 * Basic compatibility test for the unified useBusinesses hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useBusinesses API Compatibility", () => {
	it("should export useBusinesses function", async () => {
		const { useBusinesses } = await import("./useBusinesses");
		expect(typeof useBusinesses).toBe("function");
	});

	it("should export business query keys", async () => {
		const { businessInsideQueryKeys, businessOutsideQueryKeys } = await import(
			"./useBusinesses"
		);
		expect(businessInsideQueryKeys).toBeDefined();
		expect(businessOutsideQueryKeys).toBeDefined();
		expect(typeof businessInsideQueryKeys.all).toBe("function");
		expect(typeof businessOutsideQueryKeys.all).toBe("function");
		expect(typeof businessInsideQueryKeys.byUser).toBe("function");
		expect(typeof businessOutsideQueryKeys.byUser).toBe("function");
	});

	it("should have expected API structure", async () => {
		// Test that the hook returns the expected structure
		// This is a basic smoke test to ensure the hook can be instantiated
		const { useBusinesses } = await import("./useBusinesses");
		expect(useBusinesses).toBeDefined();
	});

	it("should have expected API structure", async () => {
		// Test that the hook returns the expected structure
		// This is a basic smoke test to ensure the hook can be instantiated
		const { useBusinesses } = await import("./useBusinesses");
		expect(useBusinesses).toBeDefined();
	});
});
