/**
 * Basic compatibility test for the unified useMessaging hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useMessaging API Compatibility", () => {
	it("should export useMessaging default function", async () => {
		const { default: useMessaging } = await import("./useMessaging");
		expect(typeof useMessaging).toBe("function");
	});

	it("should export useMessagingHeaders function", async () => {
		const { useMessagingHeaders } = await import("./useMessaging");
		expect(typeof useMessagingHeaders).toBe("function");
	});

	it("should export useMessagingActiveHeaders function", async () => {
		const { useMessagingActiveHeaders } = await import("./useMessaging");
		expect(typeof useMessagingActiveHeaders).toBe("function");
	});

	it("should export useMessagingUserHeaders function", async () => {
		const { useMessagingUserHeaders } = await import("./useMessaging");
		expect(typeof useMessagingUserHeaders).toBe("function");
	});

	it("should export useMessagingChats function", async () => {
		const { useMessagingChats } = await import("./useMessaging");
		expect(typeof useMessagingChats).toBe("function");
	});

	it("should export useMessagingChatById function", async () => {
		const { useMessagingChatById } = await import("./useMessaging");
		expect(typeof useMessagingChatById).toBe("function");
	});

	it("should export useMessagingMessagesByChat function", async () => {
		const { useMessagingMessagesByChat } = await import("./useMessaging");
		expect(typeof useMessagingMessagesByChat).toBe("function");
	});

	it("should export useMessagingPrivateMessagesBetweenUsers function", async () => {
		const { useMessagingPrivateMessagesBetweenUsers } = await import(
			"./useMessaging"
		);
		expect(typeof useMessagingPrivateMessagesBetweenUsers).toBe("function");
	});

	it("should export useMessagingHeaderMutations function", async () => {
		const { useMessagingHeaderMutations } = await import("./useMessaging");
		expect(typeof useMessagingHeaderMutations).toBe("function");
	});

	it("should export useMessagingChatMutations function", async () => {
		const { useMessagingChatMutations } = await import("./useMessaging");
		expect(typeof useMessagingChatMutations).toBe("function");
	});

	it("should export useMessagingMessageMutations function", async () => {
		const { useMessagingMessageMutations } = await import("./useMessaging");
		expect(typeof useMessagingMessageMutations).toBe("function");
	});

	it("should export header query keys", async () => {
		const { headerQueryKeys } = await import("./useMessaging");
		expect(headerQueryKeys).toBeDefined();
		expect(typeof headerQueryKeys.all).toBe("function");
		expect(typeof headerQueryKeys.byId).toBe("function");
	});

	it("should export chat query keys", async () => {
		const { chatQueryKeys } = await import("./useMessaging");
		expect(chatQueryKeys).toBeDefined();
		expect(typeof chatQueryKeys.all).toBe("function");
		expect(typeof chatQueryKeys.byId).toBe("function");
	});

	it("should export message query keys", async () => {
		const { messageQueryKeys } = await import("./useMessaging");
		expect(messageQueryKeys).toBeDefined();
		expect(typeof messageQueryKeys.all).toBe("function");
		expect(typeof messageQueryKeys.byId).toBe("function");
	});

	it("should export private message query keys", async () => {
		const { privateMessageQueryKeys } = await import("./useMessaging");
		expect(privateMessageQueryKeys).toBeDefined();
		expect(typeof privateMessageQueryKeys.all).toBe("function");
		expect(typeof privateMessageQueryKeys.byId).toBe("function");
	});
});
