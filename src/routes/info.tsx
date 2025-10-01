import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./info.css";

export const Route = createFileRoute("/info")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Info</h2>
			<p>Info page under development...</p>
		</main>
	),
});
