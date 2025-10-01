import { useAuth, usePresence } from "../hooks";
import "./avatar.css";

interface AvatarProps {
	size?: "sm" | "md" | "lg";
	className?: string;
	style?: React.CSSProperties;
	avatar_url?: string;
	username?: string;
}

const sizeClasses = {
	sm: "avatar--sm",
	md: "avatar--md",
	lg: "avatar--lg",
};

const sizePixels = {
	sm: 32,
	md: 48,
	lg: 64,
};

export default function Avatar({
	size = "md",
	className = "",
	style,
	avatar_url: propAvatarUrl,
	username: propUsername,
}: AvatarProps) {
	const { user } = useAuth();
	const { isUserOnline } = usePresence();

	// Use props if provided, otherwise fallback to user data
	const avatarUrl = propAvatarUrl || user?.avatar_url;
	const username = propUsername || user?.username || user?.full_name || "User";

	// Check if current user is online
	const currentUserOnline = user ? isUserOnline(user.id) : false;

	// Default avatar image
	const defaultAvatar = "/src/assets/logos/ggv-70.png";

	return (
		<div
			className={`avatar ${sizeClasses[size]} ${currentUserOnline ? "avatar--online" : ""} ${className}`}
			style={style}
		>
			{avatarUrl ? (
				<img
					src={avatarUrl}
					alt={`${username}'s avatar`}
					className="avatar__image"
					width={sizePixels[size]}
					height={sizePixels[size]}
					onError={(e) => {
						// Fallback to default avatar if image fails to load
						const target = e.target as HTMLImageElement;
						target.src = defaultAvatar;
					}}
				/>
			) : (
				<img
					src={defaultAvatar}
					alt={`${username}'s avatar`}
					className="avatar__image"
					width={sizePixels[size]}
					height={sizePixels[size]}
				/>
			)}
		</div>
	);
}
