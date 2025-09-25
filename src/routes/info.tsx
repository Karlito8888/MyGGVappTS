import { createFileRoute } from "@tanstack/react-router";
import "./info.css";

export const Route = createFileRoute("/info")({
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Info</h2>
			<p>Info page under development...</p>
		</main>
	),
});
