/**
 * Basic compatibility test for the unified useAuth hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useAuth API Compatibility", () => {
	it("should export useAuth function", async () => {
		const { useAuth } = await import("./useAuth");
		expect(typeof useAuth).toBe("function");
	});

	it("should export useProfileManagement function", async () => {
		const { useProfileManagement } = await import("./useAuth");
		expect(typeof useProfileManagement).toBe("function");
	});

	it("should export auth query keys", async () => {
		const { authQueryKeys } = await import("./useAuth");
		expect(authQueryKeys).toBeDefined();
		expect(typeof authQueryKeys.all).toBe("function");
		expect(typeof authQueryKeys.lists).toBe("function");
	});
});
