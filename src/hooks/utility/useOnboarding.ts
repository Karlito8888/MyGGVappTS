import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { authQueryKeys } from "../entities/useAuth";
const authKeys = {
	profile: authQueryKeys.details,
	user: authQueryKeys.lists,
	all: authQueryKeys.all(),
}; // Alias for compatibility

interface OnboardingData {
	username: string;
	avatar_url?: string;
}

interface LocationAssociationRequest {
	location_id: string;
	block: string;
	lot: string;
}

export function useOnboarding() {
	const queryClient = useQueryClient();

	// Update profile information (without completing onboarding)
	const updateProfileMutation = useMutation({
		mutationFn: async ({
			userId,
			data,
		}: { userId: string; data: OnboardingData }) => {
			// First check if username is already taken
			const { data: existingUser, error: checkError } = await supabase
				.from("profiles")
				.select("id")
				.eq("username", data.username)
				.neq("id", userId)
				.single();

			if (checkError && checkError.code !== "PGRST116") {
				throw checkError;
			}

			if (existingUser) {
				throw new Error("Username is already taken");
			}

			// Update the profile with onboarding data (but NOT onboarding_completed)
			// The onboarding will be completed automatically by the trigger when location is approved
			const { error } = await supabase
				.from("profiles")
				.update({
					...data,
					updated_at: new Date().toISOString(),
				})
				.eq("id", userId);

			if (error) throw error;

			return data;
		},
		onSuccess: (_, { userId }) => {
			// Invalidate auth queries to refresh user data
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.byId(userId) });
		},
	});

	// Request location association (this will trigger onboarding completion when approved or immediately if first owner)
	const requestLocationAssociationMutation = useMutation({
		mutationFn: async ({
			userId,
			locationData,
		}: { userId: string; locationData: LocationAssociationRequest }) => {
			// First, ensure the location exists or create it
			let locationId = locationData.location_id;
			let isNewLocation = false;

			if (!locationId) {
				// Try to find existing location
				const { data: existingLocation } = await supabase
					.from("locations")
					.select("id")
					.eq("block", locationData.block)
					.eq("lot", locationData.lot)
					.is("deleted_at", null)
					.single();

				if (existingLocation) {
					locationId = existingLocation.id;
				} else {
					// Create new location
					const { data: newLocation, error: locationError } = await supabase
						.from("locations")
						.insert({
							block: locationData.block,
							lot: locationData.lot,
						})
						.select("id")
						.single();

					if (locationError) throw locationError;
					locationId = newLocation.id;
					isNewLocation = true;
				}
			}

			// Check if location already has an owner
			const { data: existingAssociations, error: checkError } = await supabase
				.from("profile_location_associations")
				.select("id, is_owner")
				.eq("location_id", locationId)
				.eq("is_verified", true);

			if (checkError) throw checkError;

			const hasOwner =
				existingAssociations?.some((assoc) => assoc.is_owner) || false;

			if (!hasOwner || isNewLocation) {
				// First person to associate with this location - becomes owner immediately
				const { error: associationError } = await supabase
					.from("profile_location_associations")
					.insert({
						profile_id: userId,
						location_id: locationId,
						is_owner: true,
						is_verified: true,
					});

				if (associationError) throw associationError;

				// Complete onboarding immediately
				const { error: onboardingError } = await supabase
					.from("profiles")
					.update({
						onboarding_completed: true,
						updated_at: new Date().toISOString(),
					})
					.eq("id", userId);

				if (onboardingError) throw onboardingError;

				return { locationId, isOwner: true, immediate: true };
			}

			// Location has an owner - create association request
			const { error } = await supabase
				.from("location_association_requests")
				.insert({
					requester_id: userId,
					location_id: locationId,
					status: "pending",
				});

			if (error) throw error;

			return { locationId, isOwner: false, immediate: false };
		},
		onSuccess: (_, { userId }) => {
			// Invalidate queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			queryClient.invalidateQueries({ queryKey: authQueryKeys.byId(userId) });
		},
	});

	// Get available locations for selection (only those with existing owners)
	const { data: locations, isLoading: locationsLoading } = useQuery({
		queryKey: ["locations", "available"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("locations")
				.select(`
                    id, 
                    block, 
                    lot,
                    profile_location_associations!inner(
                        is_owner,
                        is_verified
                    )
                `)
				.is("deleted_at", null)
				.eq("profile_location_associations.is_owner", true)
				.eq("profile_location_associations.is_verified", true)
				.order("block", { ascending: true })
				.order("lot", { ascending: true });

			if (error) throw error;
			return data;
		},
	});

	return {
		// Profile update
		updateProfile: updateProfileMutation.mutate,
		isUpdatingProfile: updateProfileMutation.isPending,
		profileError: updateProfileMutation.error,
		profileSuccess: updateProfileMutation.isSuccess,

		// Location association request
		requestLocationAssociation: requestLocationAssociationMutation.mutate,
		isRequestingLocation: requestLocationAssociationMutation.isPending,
		locationError: requestLocationAssociationMutation.error,
		locationSuccess: requestLocationAssociationMutation.isSuccess,

		// Available locations
		locations,
		locationsLoading,

		// Combined loading state
		isLoading:
			updateProfileMutation.isPending ||
			requestLocationAssociationMutation.isPending,
	};
}
