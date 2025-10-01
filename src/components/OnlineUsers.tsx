import { usePresence } from "../hooks";
import "../components/online-users.css";

export function OnlineUsers() {
	const { onlineUserCount, isTracking } = usePresence();

	const onlineCount = onlineUserCount; // Alias for compatibility

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
