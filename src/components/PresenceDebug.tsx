import { usePresence, useAuth } from "../hooks";

export function PresenceDebug() {
	const { user } = useAuth();
	const { onlineUsers, isTracking, isUserOnline, onlineUserCount } =
		usePresence();

	const currentUserOnline = user ? isUserOnline(user.id) : false;
	const onlineCount = onlineUserCount; // Alias for compatibility

	if (!isTracking) {
		return <div>Presence tracking not active</div>;
	}

	return (
		<div className="presence-debug">
			<h3>Presence Debug</h3>
			<div>Total online users: {onlineCount}</div>
			<div>Current user online: {currentUserOnline ? "Yes" : "No"}</div>
			<div>
				<h4>Online users:</h4>
				<ul>
					{onlineUsers.map((user: any) => (
						<li key={user.user_id}>
							{user.username || "Unknown"} (ID: {user.user_id})
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
