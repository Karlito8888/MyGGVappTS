/**
 * Basic compatibility test for the unified usePresence hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("usePresence API Compatibility", () => {
	it("should export usePresence function", async () => {
		const { usePresence } = await import("./usePresence");
		expect(typeof usePresence).toBe("function");
	});

	it("should export usePresenceMutations function", async () => {
		const { usePresenceMutations } = await import("./usePresence");
		expect(typeof usePresenceMutations).toBe("function");
	});

	it("should export usePresenceStatus function", async () => {
		const { usePresenceStatus } = await import("./usePresence");
		expect(typeof usePresenceStatus).toBe("function");
	});

	it("should export presence query keys", async () => {
		const { presenceQueryKeys } = await import("./usePresence");
		expect(presenceQueryKeys).toBeDefined();
		expect(typeof presenceQueryKeys.all).toBe("function");
		expect(typeof presenceQueryKeys.byId).toBe("function");
	});

	it("should export types (PresenceUser and UsePresenceOptions)", async () => {
		// Types are available at compile time, this test ensures the module loads
		const module = await import("./usePresence");
		expect(module).toBeDefined();
		expect(typeof module.usePresence).toBe("function");
	});

	it("should export default function", async () => {
		const { default: usePresenceWithOptions } = await import("./usePresence");
		expect(typeof usePresenceWithOptions).toBe("function");
	});
});
