import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks";
import PageLoading from "./PageLoading";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading, error } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const currentPath = location.pathname;

	// Handle redirect logic
	useEffect(() => {
		if (loading) return; // Wait for loading to complete

		// If no user and no error, redirect to auth
		if (!user && !error) {
			navigate({ to: "/auth" });
			return;
		}

		// If user exists but onboarding not completed, redirect to onboarding
		// (except if already on onboarding page)
		if (user && !user.onboarding_completed && currentPath !== "/onboarding") {
			navigate({ to: "/onboarding" });
			return;
		}

		// If user completed onboarding but is on onboarding page, redirect to home
		if (user?.onboarding_completed && currentPath === "/onboarding") {
			navigate({ to: "/" });
			return;
		}
	}, [loading, user, error, navigate, currentPath]);

	// If there's an auth error, show error state
	if (error) {
		console.error("Auth error:", error);
		return (
			<div className="error-container">
				<h2>Authentication Error</h2>
				<p>There was a problem with authentication. Please try again.</p>
			</div>
		);
	}

	// If still loading or no user, show loading state
	if (loading || !user) {
		return <PageLoading isLoading={true} />;
	}

	// User is authenticated, render children
	return <>{children}</>;
}
