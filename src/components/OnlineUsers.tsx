import { usePresence } from "../hooks/usePresence";
import "../components/online-users.css";

export function OnlineUsers() {
	const { onlineCount, isTracking } = usePresence();

	if (!isTracking) {
		return null;
	}

	return (
		<div className="online-users">
			<span className="online-indicator" />
			<span className="online-count">{onlineCount}</span>
			<span className="online-text">online</span>
		</div>
	);
}
