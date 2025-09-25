import { useRouteStatus } from "../hooks/useRouteStatus";
import "./loading-indicator.css";

export default function GlobalLoadingIndicator() {
	const { isLoading, isTransitioning, hasPendingMatches } = useRouteStatus();

	if (!isLoading && !isTransitioning && !hasPendingMatches) {
		return null;
	}

	return (
		<div className="global-loading-indicator">
			<div className="loading-bar">
				<div className="loading-progress" />
			</div>
			{isTransitioning && <div className="loading-text">Navigating...</div>}
		</div>
	);
}
