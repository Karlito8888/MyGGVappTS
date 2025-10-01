/**
 * Unified Locations Hook
 *
 * Consolidates locations, geolocation, and associations
 * into a single, cohesive API following the new entity architecture.
 */

import { supabase } from "../../lib/supabase";
import type {
	Location,
	LocationAssociationRequest,
	ProfileLocationAssociation,
} from "../../types/database";

// Import new architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { useGenericQuery } from "../core/useGenericQuery";
import {
	useCreateMutation,
	useUpdateMutation,
	useDeleteMutation,
	useCustomMutation,
} from "../core/useMutationHooks";

/**
 * Location query keys using the new unified system
 */
const locationQueryKeys = new EntityQueryKeys("locations");
const associationRequestQueryKeys = new EntityQueryKeys(
	"location_association_requests",
);
const profileAssociationQueryKeys = new EntityQueryKeys(
	"profile_location_associations",
);

/**
 * Fetch all locations
 */
async function fetchLocations(): Promise<Location[]> {
	const { data, error } = await supabase
		.from("locations")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch location by ID
 */
async function fetchLocationById(id: string): Promise<Location | null> {
	if (!id) return null;

	const { data, error } = await supabase
		.from("locations")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw error;
	}
	return data;
}

/**
 * Fetch user's locations
 */
async function fetchUserLocations(userId: string): Promise<Location[]> {
	if (!userId) return [];

	const { data, error } = await supabase
		.from("locations")
		.select("*")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch locations by coordinates (nearby)
 */
async function fetchNearbyLocations(
	lat: number,
	lng: number,
	radiusKm = 10,
): Promise<Location[]> {
	// Using PostGIS for spatial queries
	const { data, error } = await supabase.rpc("nearby_locations", {
		lat,
		lng,
		radius_km: radiusKm,
	});

	if (error) throw error;
	return data || [];
}

/**
 * Fetch associated locations with coordinates
 */
async function fetchAssociatedLocationsWithCoords(): Promise<Location[]> {
	const { data, error } = await supabase.rpc(
		"get_associated_locations_with_coords",
	);

	if (error) throw error;
	return data as Location[];
}

/**
 * Fetch user location IDs
 */
async function fetchUserLocationIds(userId: string): Promise<string[]> {
	const { data, error } = await supabase
		.from("profile_location_associations")
		.select("location_id")
		.eq("profile_id", userId)
		.eq("is_verified", true);

	if (error) throw error;
	return data?.map((item) => item.location_id) || [];
}

/**
 * Fetch location association requests
 */
async function fetchLocationAssociationRequests(): Promise<
	LocationAssociationRequest[]
> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch location association request by ID
 */
async function fetchLocationAssociationRequestById(
	id: string,
): Promise<LocationAssociationRequest | null> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.eq("id", Number.parseInt(id))
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw error;
	}
	return data;
}

/**
 * Fetch location association requests by requester
 */
async function fetchLocationAssociationRequestsByRequester(
	requesterId: string,
): Promise<LocationAssociationRequest[]> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.eq("requester_id", requesterId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch location association requests by approver
 */
async function fetchLocationAssociationRequestsByApprover(
	approverId: string,
): Promise<LocationAssociationRequest[]> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.eq("approver_id", approverId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch location association requests by location
 */
async function fetchLocationAssociationRequestsByLocation(
	locationId: string,
): Promise<LocationAssociationRequest[]> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.eq("location_id", locationId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch location association requests by status
 */
async function fetchLocationAssociationRequestsByStatus(
	status: string,
): Promise<LocationAssociationRequest[]> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.eq("status", status)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch my location association requests
 */
async function fetchMyLocationAssociationRequests(
	currentUserId: string,
): Promise<LocationAssociationRequest[]> {
	const { data, error } = await supabase
		.from("location_association_requests")
		.select("*")
		.or(`requester_id.eq.${currentUserId},approver_id.eq.${currentUserId}`)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data || [];
}

/**
 * Fetch profile location associations
 */
async function fetchProfileLocationAssociations(): Promise<
	ProfileLocationAssociation[]
> {
	const { data, error } = await supabase
		.from("profile_location_associations")
		.select("*")
		.order("id", { ascending: false });

	if (error) throw error;
	return (data || []).map((item) => ({ ...item, id: item.id.toString() }));
}

/**
 * Fetch profile location association by ID
 */
async function fetchProfileLocationAssociationById(
	id: string,
): Promise<ProfileLocationAssociation | null> {
	const { data, error } = await supabase
		.from("profile_location_associations")
		.select("*")
		.eq("id", Number.parseInt(id))
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw error;
	}
	return { ...data, id: data.id.toString() };
}

/**
 * Fetch profile location associations by profile
 */
async function fetchProfileLocationAssociationsByProfile(
	profileId: string,
): Promise<ProfileLocationAssociation[]> {
	const { data, error } = await supabase
		.from("profile_location_associations")
		.select("*")
		.eq("profile_id", profileId)
		.order("id", { ascending: false });

	if (error) throw error;
	return (data || []).map((item) => ({ ...item, id: item.id.toString() }));
}

/**
 * Fetch profile location associations by location
 */
async function fetchProfileLocationAssociationsByLocation(
	locationId: string,
): Promise<ProfileLocationAssociation[]> {
	const { data, error } = await supabase
		.from("profile_location_associations")
		.select("*")
		.eq("location_id", locationId)
		.order("id", { ascending: false });

	if (error) throw error;
	return (data || []).map((item) => ({ ...item, id: item.id.toString() }));
}

/**
 * Hook for location by ID
 */
export function useLocationById(locationId: string) {
	return useGenericQuery<Location | null>({
		queryKey: locationQueryKeys,
		queryFn: () => fetchLocationById(locationId),
		entityName: "locations",
		operationName: "fetchById",
		additionalOptions: {
			enabled: !!locationId,
		},
	});
}

/**
 * Hook for user's locations
 */
export function useUserLocations(userId: string) {
	return useGenericQuery<Location[]>({
		queryKey: locationQueryKeys,
		queryFn: () => fetchUserLocations(userId),
		entityName: "locations",
		operationName: "fetchByUser",
		additionalOptions: {
			enabled: !!userId,
		},
	});
}

/**
 * Hook for nearby locations
 */
export function useNearbyLocations(
	lat: number,
	lng: number,
	radiusKm?: number,
) {
	return useGenericQuery<Location[]>({
		queryKey: locationQueryKeys,
		queryFn: () => fetchNearbyLocations(lat, lng, radiusKm),
		entityName: "locations",
		operationName: "fetchNearby",
		additionalOptions: {
			enabled: !!lat && !!lng,
		},
		cacheOverrides: {
			staleTime: 2 * 60 * 1000, // 2 minutes for location data
		},
	});
}

/**
 * Hook for associated locations with coordinates
 */
export function useAssociatedLocationsWithCoords() {
	return useGenericQuery<Location[]>({
		queryKey: [...locationQueryKeys.lists(), "with-coords"],
		queryFn: fetchAssociatedLocationsWithCoords,
		entityName: "location",
		operationName: "associatedWithCoords",
	});
}

/**
 * Hook for user location IDs
 */
export function useUserLocationIds(userId: string) {
	return useGenericQuery<string[]>({
		queryKey: [...locationQueryKeys.byUser(userId), "ids"],
		queryFn: () => fetchUserLocationIds(userId),
		entityName: "location",
		operationName: "userLocationIds",
		additionalOptions: {
			enabled: !!userId,
		},
	});
}

/**
 * Hook for location mutations
 */
export function useLocationMutations() {
	// Create location mutation
	const createMutation = useCreateMutation(
		async (
			locationData: Omit<Location, "id" | "created_at" | "updated_at">,
		) => {
			const { data, error } = await supabase
				.from("locations")
				.insert([locationData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: locationQueryKeys,
			entityName: "location",
			operationName: "create",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: tempId,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}),
		},
	);

	// Update location mutation
	const updateMutation = useUpdateMutation(
		async (id: string, data: Partial<Location>) => {
			const { data: updatedLocation, error } = await supabase
				.from("locations")
				.update({ ...data, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedLocation;
		},
		{
			queryKeys: locationQueryKeys,
			entityName: "location",
			operationName: "update",
			optimistic: true,
		},
	);

	// Delete location mutation
	const deleteMutation = useDeleteMutation(
		async (id: string) => {
			const { error } = await supabase.from("locations").delete().eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: locationQueryKeys,
			entityName: "location",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage: "Are you sure you want to delete this location?",
		},
	);

	return {
		createLocation: createMutation.mutate,
		updateLocation: updateMutation.mutate,
		deleteLocation: deleteMutation.mutate,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,

		reset: () => {
			createMutation.reset();
			updateMutation.reset();
			deleteMutation.reset();
		},
	};
}

/**
 * Hook for geolocation utilities
 */
export function useGeolocation() {
	const getCurrentPosition = (): Promise<GeolocationPosition> => {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Geolocation is not supported by this browser"));
				return;
			}

			navigator.geolocation.getCurrentPosition(resolve, reject, {
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 300000, // 5 minutes
			});
		});
	};

	const watchPosition = (
		callback: (position: GeolocationPosition) => void,
	): number => {
		if (!navigator.geolocation) {
			throw new Error("Geolocation is not supported by this browser");
		}

		return navigator.geolocation.watchPosition(
			callback,
			(error) => {
				console.error("Geolocation error:", error);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 300000, // 5 minutes
			},
		);
	};

	const clearWatch = (watchId: number) => {
		navigator.geolocation.clearWatch(watchId);
	};

	const calculateDistance = (
		lat1: number,
		lng1: number,
		lat2: number,
		lng2: number,
	): number => {
		const R = 6371; // Earth's radius in kilometers
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLng = ((lng2 - lng1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c; // Distance in kilometers
	};

	return {
		getCurrentPosition,
		watchPosition,
		clearWatch,
		calculateDistance,
		isSupported: !!navigator.geolocation,
	};
}

/**
 * Hook for location association requests
 */
export function useLocationAssociationRequests() {
	return useGenericQuery<LocationAssociationRequest[]>({
		queryKey: associationRequestQueryKeys,
		queryFn: fetchLocationAssociationRequests,
		entityName: "locationAssociationRequests",
		operationName: "fetchAll",
	});
}

/**
 * Hook for location association request by ID
 */
export function useLocationAssociationRequestById(requestId: string) {
	return useGenericQuery<LocationAssociationRequest | null>({
		queryKey: associationRequestQueryKeys,
		queryFn: () => fetchLocationAssociationRequestById(requestId),
		entityName: "locationAssociationRequests",
		operationName: "fetchById",
		additionalOptions: {
			enabled: !!requestId,
		},
	});
}

/**
 * Hook for location association requests by requester
 */
export function useLocationAssociationRequestsByRequester(requesterId: string) {
	return useGenericQuery<LocationAssociationRequest[]>({
		queryKey: associationRequestQueryKeys,
		queryFn: () => fetchLocationAssociationRequestsByRequester(requesterId),
		entityName: "locationAssociationRequests",
		operationName: "fetchByRequester",
		additionalOptions: {
			enabled: !!requesterId,
		},
	});
}

/**
 * Hook for location association requests by approver
 */
export function useLocationAssociationRequestsByApprover(approverId: string) {
	return useGenericQuery<LocationAssociationRequest[]>({
		queryKey: associationRequestQueryKeys,
		queryFn: () => fetchLocationAssociationRequestsByApprover(approverId),
		entityName: "locationAssociationRequests",
		operationName: "fetchByApprover",
		additionalOptions: {
			enabled: !!approverId,
		},
	});
}

/**
 * Hook for location association requests by location
 */
export function useLocationAssociationRequestsByLocation(locationId: string) {
	return useGenericQuery<LocationAssociationRequest[]>({
		queryKey: associationRequestQueryKeys,
		queryFn: () => fetchLocationAssociationRequestsByLocation(locationId),
		entityName: "locationAssociationRequests",
		operationName: "fetchByLocation",
		additionalOptions: {
			enabled: !!locationId,
		},
	});
}

/**
 * Hook for location association requests by status
 */
export function useLocationAssociationRequestsByStatus(status: string) {
	return useGenericQuery<LocationAssociationRequest[]>({
		queryKey: associationRequestQueryKeys,
		queryFn: () => fetchLocationAssociationRequestsByStatus(status),
		entityName: "locationAssociationRequests",
		operationName: "fetchByStatus",
		additionalOptions: {
			enabled: !!status,
		},
	});
}

/**
 * Hook for my location association requests
 */
export function useMyLocationAssociationRequests(currentUserId: string) {
	return useGenericQuery<LocationAssociationRequest[]>({
		queryKey: associationRequestQueryKeys,
		queryFn: () => fetchMyLocationAssociationRequests(currentUserId),
		entityName: "locationAssociationRequests",
		operationName: "fetchMyRequests",
		additionalOptions: {
			enabled: !!currentUserId,
		},
	});
}

/**
 * Hook for location association request mutations
 */
export function useLocationAssociationRequestMutations() {
	// Create association request mutation
	const createMutation = useCreateMutation(
		async (
			requestData: Omit<LocationAssociationRequest, "id" | "created_at">,
		) => {
			const { data, error } = await supabase
				.from("location_association_requests")
				.insert([requestData])
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: associationRequestQueryKeys,
			entityName: "locationAssociationRequest",
			operationName: "create",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: Number.parseInt(tempId),
				created_at: new Date().toISOString(),
			}),
		},
	);

	// Update association request mutation
	const updateMutation = useUpdateMutation(
		async (id: string, data: Partial<LocationAssociationRequest>) => {
			const { data: updatedRequest, error } = await supabase
				.from("location_association_requests")
				.update(data)
				.eq("id", Number.parseInt(id))
				.select()
				.single();

			if (error) throw error;
			return updatedRequest;
		},
		{
			queryKeys: associationRequestQueryKeys,
			entityName: "locationAssociationRequest",
			operationName: "update",
			optimistic: true,
		},
	);

	// Delete association request mutation
	const deleteMutation = useDeleteMutation(
		async (id: string) => {
			const { error } = await supabase
				.from("location_association_requests")
				.delete()
				.eq("id", Number.parseInt(id));

			if (error) throw error;
		},
		{
			queryKeys: associationRequestQueryKeys,
			entityName: "locationAssociationRequest",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage:
				"Are you sure you want to delete this association request?",
		},
	);

	// Approve association request
	const approveMutation = useCustomMutation(
		async (id: string) => {
			const { error } = await supabase
				.from("location_association_requests")
				.update({
					status: "approved",
					approved_at: new Date().toISOString(),
				})
				.eq("id", Number.parseInt(id));

			if (error) throw error;
		},
		{
			queryKeys: associationRequestQueryKeys,
			entityName: "locationAssociationRequest",
			operationName: "approve",
		},
	);

	// Reject association request
	const rejectMutation = useCustomMutation(
		async (id: string) => {
			const { error } = await supabase
				.from("location_association_requests")
				.update({
					status: "rejected",
					rejected_at: new Date().toISOString(),
				})
				.eq("id", Number.parseInt(id));

			if (error) throw error;
		},
		{
			queryKeys: associationRequestQueryKeys,
			entityName: "locationAssociationRequest",
			operationName: "reject",
		},
	);

	return {
		createRequest: createMutation.mutate,
		updateRequest: updateMutation.mutate,
		deleteRequest: deleteMutation.mutate,
		approveRequest: approveMutation.mutate,
		rejectRequest: rejectMutation.mutate,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isApproving: approveMutation.isPending,
		isRejecting: rejectMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,
		approveError: approveMutation.error,
		rejectError: rejectMutation.error,

		reset: () => {
			createMutation.reset();
			updateMutation.reset();
			deleteMutation.reset();
			approveMutation.reset();
			rejectMutation.reset();
		},
	};
}

/**
 * Hook for profile location associations
 */
export function useProfileLocationAssociations() {
	return useGenericQuery<ProfileLocationAssociation[]>({
		queryKey: profileAssociationQueryKeys,
		queryFn: fetchProfileLocationAssociations,
		entityName: "profileLocationAssociations",
		operationName: "fetchAll",
	});
}

/**
 * Hook for profile location association by ID
 */
export function useProfileLocationAssociationById(associationId: string) {
	return useGenericQuery<ProfileLocationAssociation | null>({
		queryKey: profileAssociationQueryKeys,
		queryFn: () => fetchProfileLocationAssociationById(associationId),
		entityName: "profileLocationAssociations",
		operationName: "fetchById",
		additionalOptions: {
			enabled: !!associationId,
		},
	});
}

/**
 * Hook for profile location associations by profile
 */
export function useProfileLocationAssociationsByProfile(profileId: string) {
	return useGenericQuery<ProfileLocationAssociation[]>({
		queryKey: profileAssociationQueryKeys,
		queryFn: () => fetchProfileLocationAssociationsByProfile(profileId),
		entityName: "profileLocationAssociations",
		operationName: "fetchByProfile",
		additionalOptions: {
			enabled: !!profileId,
		},
	});
}

/**
 * Hook for profile location associations by location
 */
export function useProfileLocationAssociationsByLocation(locationId: string) {
	return useGenericQuery<ProfileLocationAssociation[]>({
		queryKey: profileAssociationQueryKeys,
		queryFn: () => fetchProfileLocationAssociationsByLocation(locationId),
		entityName: "profileLocationAssociations",
		operationName: "fetchByLocation",
		additionalOptions: {
			enabled: !!locationId,
		},
	});
}

/**
 * Hook for profile location association mutations
 */
export function useProfileLocationAssociationMutations() {
	// Create association mutation
	const createMutation = useCreateMutation(
		async (associationData: Omit<ProfileLocationAssociation, "id">) => {
			const { data, error } = await supabase
				.from("profile_location_associations")
				.insert([associationData])
				.select()
				.single();

			if (error) throw error;
			return { ...data, id: data.id.toString() };
		},
		{
			queryKeys: profileAssociationQueryKeys,
			entityName: "profileLocationAssociation",
			operationName: "create",
			optimistic: true,
			createOptimisticData: (variables, tempId) => ({
				...variables,
				id: Number.parseInt(tempId),
			}),
		},
	);

	// Update association mutation
	const updateMutation = useUpdateMutation(
		async (id: string, data: Partial<ProfileLocationAssociation>) => {
			const { data: updatedAssociation, error } = await supabase
				.from("profile_location_associations")
				.update(data)
				.eq("id", Number.parseInt(id))
				.select()
				.single();

			if (error) throw error;
			return { ...updatedAssociation, id: updatedAssociation.id.toString() };
		},
		{
			queryKeys: profileAssociationQueryKeys,
			entityName: "profileLocationAssociation",
			operationName: "update",
			optimistic: true,
		},
	);

	// Delete association mutation
	const deleteMutation = useDeleteMutation(
		async (id: string) => {
			const { error } = await supabase
				.from("profile_location_associations")
				.delete()
				.eq("id", Number.parseInt(id));

			if (error) throw error;
		},
		{
			queryKeys: profileAssociationQueryKeys,
			entityName: "profileLocationAssociation",
			operationName: "delete",
			optimistic: true,
			requireConfirmation: true,
			confirmMessage:
				"Are you sure you want to remove this location association?",
		},
	);

	return {
		createAssociation: createMutation.mutate,
		updateAssociation: updateMutation.mutate,
		deleteAssociation: deleteMutation.mutate,

		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		createError: createMutation.error,
		updateError: updateMutation.error,
		deleteError: deleteMutation.error,

		reset: () => {
			createMutation.reset();
			updateMutation.reset();
			deleteMutation.reset();
		},
	};
}

/**
 * Named export for locations list (for compatibility)
 */
export function useLocationsList() {
	return useGenericQuery<Location[]>({
		queryKey: locationQueryKeys,
		queryFn: fetchLocations,
		entityName: "locations",
		operationName: "fetchAll",
	});
}

/**
 * Export query keys for external use
 */
export {
	locationQueryKeys,
	associationRequestQueryKeys,
	profileAssociationQueryKeys,
};

/**
 * Default export - unified locations hook with options
 */
export default function useLocations(options?: {
	mode?:
		| "locations"
		| "location"
		| "user-locations"
		| "nearby"
		| "associated-with-coords"
		| "user-location-ids"
		| "association-requests"
		| "association-request"
		| "association-requests-by-requester"
		| "association-requests-by-approver"
		| "association-requests-by-location"
		| "association-requests-by-status"
		| "my-association-requests"
		| "profile-associations"
		| "profile-association"
		| "profile-associations-by-profile"
		| "profile-associations-by-location";
	id?: string;
	userId?: string;
	profileId?: string;
	locationId?: string;
	requesterId?: string;
	approverId?: string;
	status?: string;
	currentUserId?: string;
	lat?: number;
	lng?: number;
	radiusKm?: number;
}) {
	const {
		mode = "locations",
		id,
		userId,
		profileId,
		locationId,
		requesterId,
		approverId,
		status,
		currentUserId,
		lat,
		lng,
		radiusKm,
	} = options || {};

	switch (mode) {
		case "locations":
			return useGenericQuery<Location[]>({
				queryKey: locationQueryKeys,
				queryFn: fetchLocations,
				entityName: "locations",
				operationName: "fetchAll",
			});
		case "location":
			if (!id) throw new Error("id is required for location mode");
			return useLocationById(id);
		case "user-locations":
			if (!userId)
				throw new Error("userId is required for user-locations mode");
			return useUserLocations(userId);
		case "nearby":
			if (lat === undefined || lng === undefined)
				throw new Error("lat and lng are required for nearby mode");
			return useNearbyLocations(lat, lng, radiusKm);
		case "associated-with-coords":
			return useAssociatedLocationsWithCoords();
		case "user-location-ids":
			if (!userId)
				throw new Error("userId is required for user-location-ids mode");
			return useUserLocationIds(userId);
		case "association-requests":
			return useLocationAssociationRequests();
		case "association-request":
			if (!id) throw new Error("id is required for association-request mode");
			return useLocationAssociationRequestById(id);
		case "association-requests-by-requester":
			if (!requesterId)
				throw new Error(
					"requesterId is required for association-requests-by-requester mode",
				);
			return useLocationAssociationRequestsByRequester(requesterId);
		case "association-requests-by-approver":
			if (!approverId)
				throw new Error(
					"approverId is required for association-requests-by-approver mode",
				);
			return useLocationAssociationRequestsByApprover(approverId);
		case "association-requests-by-location":
			if (!locationId)
				throw new Error(
					"locationId is required for association-requests-by-location mode",
				);
			return useLocationAssociationRequestsByLocation(locationId);
		case "association-requests-by-status":
			if (!status)
				throw new Error(
					"status is required for association-requests-by-status mode",
				);
			return useLocationAssociationRequestsByStatus(status);
		case "my-association-requests":
			if (!currentUserId)
				throw new Error(
					"currentUserId is required for my-association-requests mode",
				);
			return useMyLocationAssociationRequests(currentUserId);
		case "profile-associations":
			return useProfileLocationAssociations();
		case "profile-association":
			if (!id) throw new Error("id is required for profile-association mode");
			return useProfileLocationAssociationById(id);
		case "profile-associations-by-profile":
			if (!profileId)
				throw new Error(
					"profileId is required for profile-associations-by-profile mode",
				);
			return useProfileLocationAssociationsByProfile(profileId);
		case "profile-associations-by-location":
			if (!locationId)
				throw new Error(
					"locationId is required for profile-associations-by-location mode",
				);
			return useProfileLocationAssociationsByLocation(locationId);
		default:
			return useGenericQuery<Location[]>({
				queryKey: locationQueryKeys,
				queryFn: fetchLocations,
				entityName: "locations",
				operationName: "fetchAll",
			});
	}
}
