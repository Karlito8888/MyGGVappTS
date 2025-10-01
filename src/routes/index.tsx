import { createFileRoute } from "@tanstack/react-router";
import MapComponent from "../components/Map";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => (
		<main className="main-content map-page">
			<MapComponent />
		</main>
	),
});
