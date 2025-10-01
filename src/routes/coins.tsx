import { createFileRoute } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./coins.css";

export const Route = createFileRoute("/coins")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: () => <Coins />,
});

function Coins() {
	return (
		<main className="main-content">
			<h2 className="page-title">Coins</h2>
			<p>Coins page under development...</p>
		</main>
	);
}
