import { redirect } from "@tanstack/react-router";
import { authQueryKeys } from "../hooks/entities/useAuth";
import type { supabase } from "../lib/supabase";
import type { queryClient } from "../providers/QueryClientProvider";

// Define the context type for route guards
export type RouteContext = {
	queryClient: typeof queryClient;
	supabase: typeof supabase;
};

/**
 * Requires user to be authenticated. Redirects to /auth if not.
 */
export async function requireAuth(context: RouteContext) {
	const {
		data: { session },
		error,
	} = await context.supabase.auth.getSession();

	if (error || !session) {
		throw redirect({ to: "/auth" });
	}

	return session;
}

/**
 * Requires user to have completed onboarding. Redirects to /onboarding if not.
 */
export async function requireOnboarding(context: RouteContext) {
	const {
		data: { user },
	} = await context.supabase.auth.getUser();

	if (!user) return;

	// Try to get profile from cache first
	const profileKey = authQueryKeys.byId(user.id);
	let profile = context.queryClient.getQueryData(profileKey) as any;

	// If not in cache, fetch it
	if (!profile) {
		const { data, error } = await context.supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (!error && data) {
			profile = data;
			// Cache it for future use
			context.queryClient.setQueryData(profileKey, data);
		}
	}

	// Redirect to onboarding if profile exists but onboarding not completed
	if (profile && !profile.onboarding_completed) {
		throw redirect({ to: "/onboarding" });
	}
}

/**
 * Redirects authenticated users away from public pages (like /auth)
 */
export async function redirectIfAuthenticated(context: RouteContext) {
	const {
		data: { session },
	} = await context.supabase.auth.getSession();

	if (session) {
		throw redirect({ to: "/" });
	}
}

/**
 * For onboarding page: require auth but redirect if already completed
 */
export async function requireAuthForOnboarding(context: RouteContext) {
	// First ensure user is authenticated
	await requireAuth(context);

	const {
		data: { user },
	} = await context.supabase.auth.getUser();
	if (!user) return;

	// Check if onboarding already completed
	const profileKey = authQueryKeys.byId(user.id);
	let profile = context.queryClient.getQueryData(profileKey) as any;

	if (!profile) {
		const { data } = await context.supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (data) {
			profile = data;
			context.queryClient.setQueryData(profileKey, data);
		}
	}

	// Redirect to home if onboarding already completed
	if (profile?.onboarding_completed) {
		throw redirect({ to: "/" });
	}
}
