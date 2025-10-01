/**
 * Unified Authentication Hook
 *
 * Modern, simplified authentication hook that combines user auth and profile management
 * in a single, cohesive API following the new entity architecture.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/database";
import type { User } from "@supabase/supabase-js";

// Import unified architecture
import { EntityQueryKeys } from "../utils/queryKeys";
import { CacheConfigManager } from "../utils/queryConfig";
import { ErrorHandler } from "../utils/errorHandling";
import { useCustomMutation } from "../core/useMutationHooks";

/**
 * Authentication query keys using the unified system
 */
const authQueryKeys = new EntityQueryKeys("auth");

/**
 * Fetch current auth user
 */
async function fetchAuthUser(): Promise<User | null> {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error) {
		throw ErrorHandler.handleQueryError(error, "auth", "fetchUser");
	}

	return user;
}

/**
 * Fetch user profile with proper error handling
 */
async function fetchUserProfile(userId: string): Promise<Profile | null> {
	if (!userId) return null;

	const { data: profile, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", userId)
		.single();

	if (error) {
		// Handle RLS-specific errors gracefully
		if (error.code === "42501") {
			console.warn("Profile access denied for user:", userId);
			return null;
		}
		if (error.code === "PGRST116") {
			// Profile not found - this is normal for new users before trigger runs
			console.log("Profile not found for user:", userId);
			return null;
		}
		throw ErrorHandler.handleQueryError(error, "profile", "fetch");
	}

	return profile;
}

/**
 * Result interface for useAuth hook
 */
export interface UseAuthResult {
	user: Profile | null;
	authUser: User | null;
	loading: boolean;
	error: any;
	signInWithGoogle: () => void;
	signInWithFacebook: () => void;
	signOut: () => void;
	isSigningIn: boolean;
	isSigningOut: boolean;
}

/**
 * Result interface for profile management
 */
export interface ProfileManagementResult {
	createProfile: (profileData: Partial<Profile>) => void;
	updateProfile: (id: string, data: Partial<Profile>) => void;
	deleteProfile: (id: string) => void;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	createError: any;
	updateError: any;
	deleteError: any;
	reset: () => void;
}

/**
 * Unified authentication hook
 *
 * Combines user authentication and profile management in a single, simplified API.
 */
export function useAuth(): UseAuthResult {
	const queryClient = useQueryClient();
	const cacheConfig = CacheConfigManager.getConfig("auth");

	// Query for current auth user
	const userQuery = useQuery({
		queryKey: authQueryKeys.all(),
		queryFn: fetchAuthUser,
		staleTime: cacheConfig.staleTime,
		gcTime: cacheConfig.gcTime,
		retry: cacheConfig.retry,
		retryDelay: cacheConfig.retryDelay,
		refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
		refetchOnReconnect: cacheConfig.refetchOnReconnect,
	});

	// Query for user profile
	const profileQuery = useQuery({
		queryKey: authQueryKeys.lists(),
		queryFn: () => fetchUserProfile(userQuery.data?.id || ""),
		enabled: !!userQuery.data?.id,
		staleTime: cacheConfig.staleTime,
		gcTime: cacheConfig.gcTime,
		retry: cacheConfig.retry,
		retryDelay: cacheConfig.retryDelay,
	});

	// Listen for auth state changes
	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			const currentUser = session?.user ?? null;

			// Update auth user query
			queryClient.setQueryData(authQueryKeys.all(), currentUser);

			if (currentUser) {
				// Invalidate and refetch profile for the new user
				queryClient.invalidateQueries({
					queryKey: authQueryKeys.lists(),
				});
			} else {
				// Clear all auth-related queries
				queryClient.removeQueries({ queryKey: authQueryKeys.all() });
			}
		});

		return () => subscription.unsubscribe();
	}, [queryClient]);

	// Sign in with Google mutation
	const signInWithGoogleMutation = useCustomMutation<undefined, undefined>(
		async () => {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					queryParams: {
						access_type: "offline",
						prompt: "consent",
					},
				},
			});

			if (error) throw error;
		},
		{
			queryKeys: authQueryKeys,
			entityName: "auth",
			operationName: "signInWithGoogle",
			invalidateOnSuccess: false, // Auth state change will handle it
		},
	);

	// Sign in with Facebook mutation
	const signInWithFacebookMutation = useCustomMutation<undefined, undefined>(
		async () => {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "facebook",
			});

			if (error) throw error;
		},
		{
			queryKeys: authQueryKeys,
			entityName: "auth",
			operationName: "signInWithFacebook",
			invalidateOnSuccess: false, // Auth state change will handle it
		},
	);

	// Sign out mutation
	const signOutMutation = useCustomMutation<undefined, undefined>(
		async () => {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// Clear all queries on sign out
			queryClient.clear();
		},
		{
			queryKeys: authQueryKeys,
			entityName: "auth",
			operationName: "signOut",
			invalidateOnSuccess: false, // We handle clearing manually
		},
	);

	// Memoized sign-in functions
	const signInWithGoogle = useCallback(() => {
		signInWithGoogleMutation.mutate(undefined);
	}, [signInWithGoogleMutation]);

	const signInWithFacebook = useCallback(() => {
		signInWithFacebookMutation.mutate(undefined);
	}, [signInWithFacebookMutation]);

	const signOut = useCallback(() => {
		signOutMutation.mutate(undefined);
	}, [signOutMutation]);

	// Combine loading states
	const loading = userQuery.isLoading || profileQuery.isLoading;

	// Combine errors
	const error =
		userQuery.error ||
		profileQuery.error ||
		signInWithGoogleMutation.error ||
		signInWithFacebookMutation.error ||
		signOutMutation.error;

	return {
		// User data (profile or null)
		user: profileQuery.data || null,

		// Auth user (raw Supabase user)
		authUser: userQuery.data || null,

		// Loading state
		loading,

		// Error state
		error,

		// Authentication methods
		signInWithGoogle,
		signInWithFacebook,
		signOut,

		// Mutation states for UI feedback
		isSigningIn:
			signInWithGoogleMutation.isPending ||
			signInWithFacebookMutation.isPending,
		isSigningOut: signOutMutation.isPending,
	};
}

/**
 * Profile management hook
 *
 * Provides CRUD operations for user profiles.
 */
export function useProfileManagement(): ProfileManagementResult {
	// Create profile mutation
	const createProfileMutation = useCustomMutation<Profile, Partial<Profile>>(
		async (profileData: Partial<Profile>) => {
			const { data, error } = await supabase
				.from("profiles")
				.insert(profileData)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		{
			queryKeys: authQueryKeys,
			entityName: "profile",
			operationName: "create",
		},
	);

	// Update profile mutation
	const updateProfileMutation = useCustomMutation<
		Profile,
		{ id: string; data: Partial<Profile> }
	>(
		async ({ id, data }: { id: string; data: Partial<Profile> }) => {
			const { data: updatedProfile, error } = await supabase
				.from("profiles")
				.update(data)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return updatedProfile;
		},
		{
			queryKeys: authQueryKeys,
			entityName: "profile",
			operationName: "update",
		},
	);

	// Delete profile mutation
	const deleteProfileMutation = useCustomMutation<void, string>(
		async (id: string) => {
			const { error } = await supabase.from("profiles").delete().eq("id", id);

			if (error) throw error;
		},
		{
			queryKeys: authQueryKeys,
			entityName: "profile",
			operationName: "delete",
		},
	);

	return {
		createProfile: createProfileMutation.mutate,
		updateProfile: (id: string, data: Partial<Profile>) =>
			updateProfileMutation.mutate({ id, data }),
		deleteProfile: deleteProfileMutation.mutate,

		isCreating: createProfileMutation.isPending,
		isUpdating: updateProfileMutation.isPending,
		isDeleting: deleteProfileMutation.isPending,

		createError: createProfileMutation.error,
		updateError: updateProfileMutation.error,
		deleteError: deleteProfileMutation.error,

		reset: () => {
			createProfileMutation.reset();
			updateProfileMutation.reset();
			deleteProfileMutation.reset();
		},
	};
}

/**
 * Export query keys for external use
 */
export { authQueryKeys };
