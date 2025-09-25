import { createFileRoute } from "@tanstack/react-router";
import "./messages.css";

export const Route = createFileRoute("/messages")({
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Messages</h2>
			<p>Messages page under development...</p>
		</main>
	),
});
