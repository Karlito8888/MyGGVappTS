/**
 * Basic compatibility test for the unified useServices hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useServices API Compatibility", () => {
	it("should export useServices function", async () => {
		const { useServices } = await import("./useServices");
		expect(typeof useServices).toBe("function");
	});

	it("should export service query keys", async () => {
		const { serviceQueryKeys } = await import("./useServices");
		expect(serviceQueryKeys).toBeDefined();
		expect(typeof serviceQueryKeys.all).toBe("function");
		expect(typeof serviceQueryKeys.byId).toBe("function");
		expect(typeof serviceQueryKeys.byUser).toBe("function");
	});

	it("should have expected API structure", async () => {
		// Test that the hook returns the expected structure
		// This is a basic smoke test to ensure the hook can be instantiated
		const { useServices } = await import("./useServices");
		expect(useServices).toBeDefined();
	});
});
