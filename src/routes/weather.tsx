import { createFileRoute } from "@tanstack/react-router";
import "./weather.css";

export const Route = createFileRoute("/weather")({
	component: () => (
		<main className="main-content">
			<h2 className="page-title">Weather</h2>
			<p>Weather page under development...</p>
		</main>
	),
});
