/**
 * Basic compatibility test for the unified useLocations hook
 */

import { describe, it, expect } from "vitest";

// Test that the hook can be imported and has the expected interface
describe("useLocations API Compatibility", () => {
	it("should export useLocationsList function", async () => {
		const { useLocationsList } = await import("./useLocations");
		expect(typeof useLocationsList).toBe("function");
	});

	it("should export useLocationById function", async () => {
		const { useLocationById } = await import("./useLocations");
		expect(typeof useLocationById).toBe("function");
	});

	it("should export useUserLocations function", async () => {
		const { useUserLocations } = await import("./useLocations");
		expect(typeof useUserLocations).toBe("function");
	});

	it("should export useNearbyLocations function", async () => {
		const { useNearbyLocations } = await import("./useLocations");
		expect(typeof useNearbyLocations).toBe("function");
	});

	it("should export useAssociatedLocationsWithCoords function", async () => {
		const { useAssociatedLocationsWithCoords } = await import("./useLocations");
		expect(typeof useAssociatedLocationsWithCoords).toBe("function");
	});

	it("should export useUserLocationIds function", async () => {
		const { useUserLocationIds } = await import("./useLocations");
		expect(typeof useUserLocationIds).toBe("function");
	});

	it("should export useGeolocation function", async () => {
		const { useGeolocation } = await import("./useLocations");
		expect(typeof useGeolocation).toBe("function");
	});

	it("should export useLocationAssociationRequests function", async () => {
		const { useLocationAssociationRequests } = await import("./useLocations");
		expect(typeof useLocationAssociationRequests).toBe("function");
	});

	it("should export useLocationAssociationRequestById function", async () => {
		const { useLocationAssociationRequestById } = await import(
			"./useLocations"
		);
		expect(typeof useLocationAssociationRequestById).toBe("function");
	});

	it("should export useLocationAssociationRequestsByRequester function", async () => {
		const { useLocationAssociationRequestsByRequester } = await import(
			"./useLocations"
		);
		expect(typeof useLocationAssociationRequestsByRequester).toBe("function");
	});

	it("should export useLocationAssociationRequestsByApprover function", async () => {
		const { useLocationAssociationRequestsByApprover } = await import(
			"./useLocations"
		);
		expect(typeof useLocationAssociationRequestsByApprover).toBe("function");
	});

	it("should export useLocationAssociationRequestsByLocation function", async () => {
		const { useLocationAssociationRequestsByLocation } = await import(
			"./useLocations"
		);
		expect(typeof useLocationAssociationRequestsByLocation).toBe("function");
	});

	it("should export useLocationAssociationRequestsByStatus function", async () => {
		const { useLocationAssociationRequestsByStatus } = await import(
			"./useLocations"
		);
		expect(typeof useLocationAssociationRequestsByStatus).toBe("function");
	});

	it("should export useMyLocationAssociationRequests function", async () => {
		const { useMyLocationAssociationRequests } = await import("./useLocations");
		expect(typeof useMyLocationAssociationRequests).toBe("function");
	});

	it("should export useLocationAssociationRequestMutations function", async () => {
		const { useLocationAssociationRequestMutations } = await import(
			"./useLocations"
		);
		expect(typeof useLocationAssociationRequestMutations).toBe("function");
	});

	it("should export useProfileLocationAssociations function", async () => {
		const { useProfileLocationAssociations } = await import("./useLocations");
		expect(typeof useProfileLocationAssociations).toBe("function");
	});

	it("should export useProfileLocationAssociationById function", async () => {
		const { useProfileLocationAssociationById } = await import(
			"./useLocations"
		);
		expect(typeof useProfileLocationAssociationById).toBe("function");
	});

	it("should export useProfileLocationAssociationsByProfile function", async () => {
		const { useProfileLocationAssociationsByProfile } = await import(
			"./useLocations"
		);
		expect(typeof useProfileLocationAssociationsByProfile).toBe("function");
	});

	it("should export useProfileLocationAssociationsByLocation function", async () => {
		const { useProfileLocationAssociationsByLocation } = await import(
			"./useLocations"
		);
		expect(typeof useProfileLocationAssociationsByLocation).toBe("function");
	});

	it("should export useProfileLocationAssociationMutations function", async () => {
		const { useProfileLocationAssociationMutations } = await import(
			"./useLocations"
		);
		expect(typeof useProfileLocationAssociationMutations).toBe("function");
	});

	it("should export useLocationMutations function", async () => {
		const { useLocationMutations } = await import("./useLocations");
		expect(typeof useLocationMutations).toBe("function");
	});

	it("should export location query keys", async () => {
		const { locationQueryKeys } = await import("./useLocations");
		expect(locationQueryKeys).toBeDefined();
		expect(typeof locationQueryKeys.all).toBe("function");
		expect(typeof locationQueryKeys.byId).toBe("function");
	});

	it("should export association request query keys", async () => {
		const { associationRequestQueryKeys } = await import("./useLocations");
		expect(associationRequestQueryKeys).toBeDefined();
		expect(typeof associationRequestQueryKeys.all).toBe("function");
		expect(typeof associationRequestQueryKeys.byId).toBe("function");
	});

	it("should export profile association query keys", async () => {
		const { profileAssociationQueryKeys } = await import("./useLocations");
		expect(profileAssociationQueryKeys).toBeDefined();
		expect(typeof profileAssociationQueryKeys.all).toBe("function");
		expect(typeof profileAssociationQueryKeys.byId).toBe("function");
	});

	it("should export default function", async () => {
		const { default: useLocations } = await import("./useLocations");
		expect(typeof useLocations).toBe("function");
	});
});
