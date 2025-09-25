import { useAuth } from "../hooks/useAuth";
import { usePresence } from "../hooks/usePresence";
import "./avatar.css";

interface AvatarProps {
	size?: "sm" | "md" | "lg";
	className?: string;
	style?: React.CSSProperties;
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
}: AvatarProps) {
	const { user } = useAuth();
	const { currentUserOnline } = usePresence();

	if (!user) {
		return (
			<div
				className={`avatar avatar--placeholder ${sizeClasses[size]} ${className}`}
				style={style}
			>
				<span className="avatar__placeholder-icon">👤</span>
			</div>
		);
	}

	return (
		<div
			className={`avatar ${sizeClasses[size]} ${currentUserOnline ? "avatar--online" : ""} ${className}`}
			style={style}
		>
			{user.avatar_url ? (
				<img
					src={user.avatar_url}
					alt={`${user.username || user.full_name || "User"}'s avatar`}
					className="avatar__image"
					width={sizePixels[size]}
					height={sizePixels[size]}
					onError={(e) => {
						// Fallback to placeholder if image fails to load
						const target = e.target as HTMLImageElement;
						target.style.display = "none";
						const parent = target.parentElement;
						if (parent) {
							const placeholder = document.createElement("span");
							placeholder.className = "avatar__placeholder-icon";
							placeholder.textContent = "👤";
							parent.appendChild(placeholder);
						}
					}}
				/>
			) : (
				<span className="avatar__placeholder-icon">👤</span>
			)}
		</div>
	);
}
