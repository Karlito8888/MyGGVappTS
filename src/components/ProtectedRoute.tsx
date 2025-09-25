import { redirect } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import PageLoading from "./PageLoading";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, loading } = useAuth();

	// If no user and not loading, redirect to auth
	if (!loading && !user) {
		throw redirect({ to: "/auth" });
	}

	// If still loading, show PageLoading
	if (loading) {
		return <PageLoading isLoading={true} />;
	}

	// User is authenticated, render children
	return <>{children}</>;
}
