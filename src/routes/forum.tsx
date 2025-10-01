import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./forum.css";

export const Route = createFileRoute("/forum")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Forum</h2>
			<p>Forum page under development...</p>
		</main>
	),
});
