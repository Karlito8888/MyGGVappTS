import { createFileRoute } from "@tanstack/react-router";
import "./forum.css";

export const Route = createFileRoute("/forum")({
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Forum</h2>
			<p>Forum page under development...</p>
		</main>
	),
});
