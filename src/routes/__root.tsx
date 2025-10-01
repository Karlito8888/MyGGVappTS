import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import type { supabase } from "../lib/supabase";
import type { queryClient } from "../providers/QueryClientProvider";

export const Route = createRootRouteWithContext<{
	queryClient: typeof queryClient;
	supabase: typeof supabase;
}>()({
	component: AppLayout,
	notFoundComponent: () => (
		<div className="error-container">
			<h2>404 - Page Not Found</h2>
			<p>The page you're looking for doesn't exist.</p>
		</div>
	),
	errorComponent: () => (
		<div className="error-container">
			<h2>Something went wrong</h2>
			<p>
				Please try refreshing the page or contact support if the problem
				persists.
			</p>
		</div>
	),
});

function AppLayout() {
	return (
		<>
			<Header />
			<Navigation />
			<Outlet />
			<Footer />
			{import.meta.env.DEV && (
				<TanStackRouterDevtools position="bottom-right" />
			)}
		</>
	);
}
