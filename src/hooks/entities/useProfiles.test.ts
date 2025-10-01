/**
 * Basic compatibility test for the unified useProfiles hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useProfiles API Compatibility", () => {
	it("should export useProfiles function", async () => {
		const { useProfiles } = await import("./useProfiles");
		expect(typeof useProfiles).toBe("function");
	});

	it("should export useProfileMutations function", async () => {
		const { useProfileMutations } = await import("./useProfiles");
		expect(typeof useProfileMutations).toBe("function");
	});

	it("should export useProfileUtils function", async () => {
		const { useProfileUtils } = await import("./useProfiles");
		expect(typeof useProfileUtils).toBe("function");
	});

	it("should export profile query keys", async () => {
		const { profileQueryKeys } = await import("./useProfiles");
		expect(profileQueryKeys).toBeDefined();
		expect(typeof profileQueryKeys.all).toBe("function");
		expect(typeof profileQueryKeys.byId).toBe("function");
	});
});
