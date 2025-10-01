import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./games.css";

export const Route = createFileRoute("/games")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Games</h2>
			<p>Games page under development...</p>
		</main>
	),
});
