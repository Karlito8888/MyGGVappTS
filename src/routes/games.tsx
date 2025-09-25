import { createFileRoute } from "@tanstack/react-router";
import "./games.css";

export const Route = createFileRoute("/games")({
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Games</h2>
			<p>Games page under development...</p>
		</main>
	),
});
