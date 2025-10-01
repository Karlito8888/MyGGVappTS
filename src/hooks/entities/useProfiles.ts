/**
 * Unified Profiles Hook
 *
 * Modern, unified profiles hook that combines all profile operations
 * in a single, cohesive API following the new entity architecture.
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/database";

// Import unified architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { CacheConfigManager } from "../utils/queryConfig";
import { ErrorHandler } from "../utils/errorHandling";
import { useCustomMutation } from "../core/useMutationHooks";

// Query functions (previously in queryFunctions.ts)
const profilesQueries = {
	getAll: async () => {
		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	getById: async (id: string) => {
		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	},
};

/**
 * Profile query keys using the unified system
 */
const profileQueryKeys = new EntityQueryKeys("profiles");

/**
 * Wrapper functions for queryFunctions compatibility with useQuery
 */
const fetchProfiles = async (): Promise<Profile[]> => {
	const result = await profilesQueries.getAll();
	return result as Profile[];
};

const fetchProfileById = async (id: string): Promise<Profile | null> => {
	const result = await profilesQueries.getById(id);
	return result as Profile | null;
};

/**
 * Fetch profile by username (not in queryFunctions yet)
 */
async function fetchProfileByUsername(
	username: string,
): Promise<Profile | null> {
	if (!username) return null;

	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("username", username)
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw ErrorHandler.handleQueryError(error, "profiles", "fetchByUsername");
	}
	return data;
}

/**
 * Search profiles by query (not in queryFunctions yet)
 */
async function searchProfiles(query: string): Promise<Profile[]> {
	if (!query) return [];

	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.or(
			`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`,
		)
		.order("username", { ascending: true });

	if (error) throw ErrorHandler.handleQueryError(error, "profiles", "search");
	return data || [];
}

/**
 * Result interface for useProfiles hook
 */
export interface UseProfilesResult {
	// Data
	profiles: Profile[];
	profile: Profile | null; // Alias for single profile

	// State
	loading: boolean;
	error: any;

	// Refetch
	refetch: () => void;
}

/**
 * Result interface for profile mutations
 */
export interface ProfileMutationsResult {
	createProfile: (
		profileData: Omit<Profile, "id" | "created_at" | "updated_at">,
	) => void;
	updateProfile: (id: string, data: Partial<Profile>) => void;
	updateAvatar: (id: string, avatarUrl: string) => void;
	deleteProfile: (id: string) => void;

	isCreating: boolean;
	isUpdating: boolean;
	isUpdatingAvatar: boolean;
	isDeleting: boolean;

	createError: any;
	updateError: any;
	updateAvatarError: any;
	deleteError: any;

	reset: () => void;
}

/**
 * Result interface for profile utilities
 */
export interface ProfileUtilsResult {
	validateUsername: (username: string) => Promise<boolean>;
	generateUsername: (fullName: string) => Promise<string>;
	getProfileCompletion: (profile: Partial<Profile>) => number;
}

/**
 * Unified profiles hook
 *
 * Provides all profile-related operations in a single, simplified API.
 */
export function useProfiles(options?: {
	mode?: "all" | "byId" | "byUsername" | "search";
	id?: string;
	username?: string;
	searchQuery?: string;
}): UseProfilesResult {
	const cacheConfig = CacheConfigManager.getConfig("profiles");

	const { mode = "all", id, username, searchQuery } = options || {};

	// Query for all profiles
	const allProfilesQuery = useQuery({
		queryKey: profileQueryKeys.all(),
		queryFn: fetchProfiles,
		staleTime: cacheConfig.staleTime,
		gcTime: cacheConfig.gcTime,
		enabled: mode === "all",
	});

	// Query for profile by ID
	const profileByIdQuery = useQuery({
		queryKey: profileQueryKeys.byId(id || ""),
		queryFn: () => fetchProfileById(id || ""),
		staleTime: cacheConfig.staleTime,
		gcTime: cacheConfig.gcTime,
		enabled: mode === "byId" && !!id,
	});

	// Query for profile by username
	const profileByUsernameQuery = useQuery({
		queryKey: profileQueryKeys.byId(username || ""),
		queryFn: () => fetchProfileByUsername(username || ""),
		staleTime: cacheConfig.staleTime,
		gcTime: cacheConfig.gcTime,
		enabled: mode === "byUsername" && !!username,
	});

	// Query for profile search
	const searchProfilesQuery = useQuery({
		queryKey: profileQueryKeys.lists(),
		queryFn: () => searchProfiles(searchQuery || ""),
		staleTime: 2 * 60 * 1000, // 2 minutes for search results
		gcTime: cacheConfig.gcTime,
		enabled: mode === "search" && !!searchQuery && searchQuery.length >= 2,
	});

	// Determine which query to use based on mode
	let activeQuery: any;
	let data: any;

	switch (mode) {
		case "byId":
			activeQuery = profileByIdQuery;
			data = profileByIdQuery.data;
			break;
		case "byUsername":
			activeQuery = profileByUsernameQuery;
			data = profileByUsernameQuery.data;
			break;
		case "search":
			activeQuery = searchProfilesQuery;
			data = searchProfilesQuery.data;
			break;
		default:
			activeQuery = allProfilesQuery;
			data = allProfilesQuery.data;
	}

	const refetch = useCallback(() => {
		activeQuery.refetch();
	}, [activeQuery]);

	return {
		// Data
		profiles: Array.isArray(data) ? data : data ? [data] : [],
		profile: Array.isArray(data) ? null : data || null,

		// State
		loading: activeQuery.isLoading,
		error: activeQuery.error,

		// Actions
		refetch,
	};
}

/**
 * Profile mutations hook
 *
 * Provides CRUD operations for profiles.
 */
export function useProfileMutations(): ProfileMutationsResult {
	// Create profile mutation
	const createProfileMutation = useCustomMutation(
		async (profileData: Omit<Profile, "id" | "created_at" | "updated_at">) => {
			const { data, error } = await supabase
				.from("profiles")
				.insert([profileData])
				.select()
				.single();

			if (error) {
				// Handle RLS-specific errors
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only create your own profile",
					);
				}
				throw ErrorHandler.handleQueryError(error, "profile", "create");
			}
			return data;
		},
		{
			queryKeys: profileQueryKeys,
			entityName: "profile",
			operationName: "create",
		},
	);

	// Update profile mutation
	const updateProfileMutation = useCustomMutation(
		async ({ id, data }: { id: string; data: Partial<Profile> }) => {
			const { data: updatedProfile, error } = await supabase
				.from("profiles")
				.update({ ...data, updated_at: new Date().toISOString() })
				.eq("id", id)
				.select()
				.single();

			if (error) {
				// Handle RLS-specific errors
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only update your own profile",
					);
				}
				throw ErrorHandler.handleQueryError(error, "profile", "update");
			}
			return updatedProfile;
		},
		{
			queryKeys: profileQueryKeys,
			entityName: "profile",
			operationName: "update",
		},
	);

	// Update avatar mutation
	const updateAvatarMutation = useCustomMutation(
		async ({ id, avatarUrl }: { id: string; avatarUrl: string }) => {
			const { data: updatedProfile, error } = await supabase
				.from("profiles")
				.update({
					avatar_url: avatarUrl,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) {
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only update your own profile",
					);
				}
				throw ErrorHandler.handleQueryError(error, "profile", "updateAvatar");
			}
			return updatedProfile;
		},
		{
			queryKeys: profileQueryKeys,
			entityName: "profile",
			operationName: "updateAvatar",
		},
	);

	// Delete profile mutation (soft delete by deactivating)
	const deleteProfileMutation = useCustomMutation(
		async (id: string) => {
			// Show confirmation dialog
			const confirmed = window.confirm(
				"Are you sure you want to delete your profile? This action cannot be undone.",
			);
			if (!confirmed) {
				throw new Error("Profile deletion cancelled by user");
			}

			const { error } = await supabase
				.from("profiles")
				.update({
					is_active: false,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (error) {
				if (error.code === "42501") {
					throw new Error(
						"Permission denied: You can only delete your own profile",
					);
				}
				throw ErrorHandler.handleQueryError(error, "profile", "delete");
			}
		},
		{
			queryKeys: profileQueryKeys,
			entityName: "profile",
			operationName: "delete",
		},
	);

	return {
		createProfile: createProfileMutation.mutate,
		updateProfile: (id: string, data: Partial<Profile>) =>
			updateProfileMutation.mutate({ id, data }),
		updateAvatar: (id: string, avatarUrl: string) =>
			updateAvatarMutation.mutate({ id, avatarUrl }),
		deleteProfile: deleteProfileMutation.mutate,

		isCreating: createProfileMutation.isPending,
		isUpdating: updateProfileMutation.isPending,
		isUpdatingAvatar: updateAvatarMutation.isPending,
		isDeleting: deleteProfileMutation.isPending,

		createError: createProfileMutation.error,
		updateError: updateProfileMutation.error,
		updateAvatarError: updateAvatarMutation.error,
		deleteError: deleteProfileMutation.error,

		reset: () => {
			createProfileMutation.reset();
			updateProfileMutation.reset();
			updateAvatarMutation.reset();
			deleteProfileMutation.reset();
		},
	};
}

/**
 * Profile utilities hook
 *
 * Provides utility functions for profile operations.
 */
export function useProfileUtils(): ProfileUtilsResult {
	const validateUsername = async (username: string): Promise<boolean> => {
		if (!username || username.length < 3) return false;

		const { data, error } = await supabase
			.from("profiles")
			.select("id")
			.eq("username", username)
			.single();

		if (error && error.code !== "PGRST116") {
			throw ErrorHandler.handleQueryError(
				error,
				"profiles",
				"validateUsername",
			);
		}

		return !data; // Return true if username is available (no data found)
	};

	const generateUsername = async (fullName: string): Promise<string> => {
		const baseName = fullName
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "")
			.substring(0, 15);

		let username = baseName;
		let counter = 1;

		while (!(await validateUsername(username))) {
			username = `${baseName}${counter}`;
			counter++;
		}

		return username;
	};

	const getProfileCompletion = (profile: Partial<Profile>): number => {
		const fields = [
			"username",
			"full_name",
			"bio",
			"avatar_url",
			"location",
			"website",
			"social_links",
		];

		const completedFields = fields.filter((field) => {
			const value = profile[field as keyof Profile];
			if (typeof value === "string") return value.trim().length > 0;
			if (typeof value === "object")
				return value !== null && Object.keys(value).length > 0;
			return value !== null && value !== undefined;
		});

		return Math.round((completedFields.length / fields.length) * 100);
	};

	return {
		validateUsername,
		generateUsername,
		getProfileCompletion,
	};
}

/**
 * Export query keys for external use
 */
export { profileQueryKeys };

export interface UseProfilesResult {
	profiles: Profile[];
	loading: boolean;
	error: any;
	// CRUD operations...
}
