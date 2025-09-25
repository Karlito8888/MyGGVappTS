import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Footer from "../components/Footer";
import GlobalLoadingIndicator from "../components/GlobalLoadingIndicator";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import ProtectedRoute from "../components/ProtectedRoute";

export const Route = createRootRoute({
	component: AppLayout,
});

function AppLayout() {
	const location = useLocation();
	const currentPath = location.pathname;

	// Don't protect auth route
	if (currentPath === "/auth") {
		return (
			<>
				<GlobalLoadingIndicator />
				<Outlet />
				{import.meta.env.DEV && <TanStackRouterDevtools />}
			</>
		);
	}

	return (
		<ProtectedRoute>
			<>
				<GlobalLoadingIndicator />
				<Header />
				<Navigation currentPath={currentPath} />
				<Outlet />
				<Footer />
				{import.meta.env.DEV && <TanStackRouterDevtools />}
			</>
		</ProtectedRoute>
	);
}
