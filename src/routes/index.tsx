import { createFileRoute } from "@tanstack/react-router";
import MapComponent from "../components/Map";

export const Route = createFileRoute("/")({
	component: () => (
		<main className="main-content map-page">
			<MapComponent />
		</main>
	),
});
