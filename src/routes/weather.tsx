import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./weather.css";

export const Route = createFileRoute("/weather")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Weather</h2>
			<p>Weather page under development...</p>
		</main>
	),
});
