import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./messages.css";

export const Route = createFileRoute("/messages")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Messages</h2>
			<p>Messages page under development...</p>
		</main>
	),
});
