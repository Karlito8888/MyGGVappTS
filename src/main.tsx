import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import { supabase } from "./lib/supabase";
import { AuthProvider } from "./providers/AuthProvider";
// Import providers
import { QueryProvider, queryClient } from "./providers/QueryClientProvider";

import "./styles.css";

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		queryClient,
		supabase,
	},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 30_000, // 30 seconds cache for preloaded data
	defaultPreloadDelay: 200, // 200ms delay before preloading
	defaultGcTime: 5 * 60 * 1000, // 5 minutes garbage collection
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// RouterContext type is already exported above

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<AuthProvider>
				<QueryProvider>
					<RouterProvider router={router} />
				</QueryProvider>
			</AuthProvider>
		</StrictMode>,
	);
}
