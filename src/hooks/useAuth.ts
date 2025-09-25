import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/database";

export const authKeys = {
	all: ["auth"] as const,
	user: () => [...authKeys.all, "user"] as const,
	profile: (userId: string) => [...authKeys.all, "profile", userId] as const,
};

async function fetchUserProfile(userId: string): Promise<Profile | null> {
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
		console.error("Profile fetch error:", error);
		return null;
	}

	return profile;
}

export function useAuth() {
	const queryClient = useQueryClient();

	// Query pour l'utilisateur actuel
	const userQuery = useQuery({
		queryKey: authKeys.user(),
		queryFn: async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			return user;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		retry: false,
	});

	// Query pour le profil (seulement si on a un user)
	const profileQuery = useQuery({
		queryKey: authKeys.profile(userQuery.data?.id || ""),
		queryFn: () => fetchUserProfile(userQuery.data?.id || ""),
		enabled: !!userQuery.data?.id,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	// Écouter les changements d'auth
	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			const currentUser = session?.user ?? null;

			// Invalider et refetch les queries auth
			queryClient.setQueryData(authKeys.user(), currentUser);

			if (currentUser) {
				// Refetch le profil pour le nouvel utilisateur
				queryClient.invalidateQueries({
					queryKey: authKeys.profile(currentUser.id),
				});
			} else {
				// Clear toutes les données auth
				queryClient.removeQueries({ queryKey: authKeys.all });
			}
		});

		return () => subscription.unsubscribe();
	}, [queryClient]);

	const signInWithGoogle = async () => {
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
	};

	const signInWithFacebook = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "facebook",
		});

		if (error) throw error;
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;

		// Clear toutes les queries
		queryClient.clear();
	};

	return {
		user: profileQuery.data || null,
		loading: userQuery.isLoading || profileQuery.isLoading,
		error: userQuery.error || profileQuery.error,
		signInWithGoogle,
		signInWithFacebook,
		signOut,
	};
}
