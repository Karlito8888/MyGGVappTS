import { createFileRoute } from "@tanstack/react-router";
import "./coins.css";

export const Route = createFileRoute("/coins")({
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
