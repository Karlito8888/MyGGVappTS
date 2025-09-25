import { Link, useNavigate } from "@tanstack/react-router";
import {
	Cloud,
	Coins,
	FileText,
	Gamepad2,
	Home,
	Info,
	LogOut,
	MessageSquare,
	ShoppingCart,
	User,
} from "lucide-react";
import "./navigation.css";

interface NavigationProps {
	currentPath: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
	const navigate = useNavigate();

	const handleNavigation = (path: string) => {
		if (path === "/logout") {
			// Handle logout logic here
			console.log("Logout clicked");
			return;
		}
		navigate({ to: path });
	};

	const isActive = (path: string) => {
		return currentPath === path;
	};

	const navItems = [
		{ path: "/", label: "Home", icon: Home, preload: false as const },
		{
			path: "/messages",
			label: "Messages",
			icon: MessageSquare,
			preload: false as const,
		},
		{ path: "/info", label: "Info", icon: Info, preload: false as const },
		{
			path: "/marketplace",
			label: "Marketplace",
			icon: ShoppingCart,
			preload: "intent" as const,
		},
		{ path: "/games", label: "Games", icon: Gamepad2, preload: false as const },
		{ path: "/coins", label: "Coins", icon: Coins, preload: false as const },
		{ path: "/weather", label: "Weather", icon: Cloud, preload: false as const },
		{
			path: "/posts",
			label: "Posts",
			icon: FileText,
			preload: "intent" as const,
		},
		{
			path: "/profile",
			label: "Profile",
			icon: User,
			preload: "intent" as const,
		},
		{ path: "/logout", label: "Logout", icon: LogOut, preload: false as const },
	];

	return (
		<aside className="sidebar">
			<nav className="sidebar-nav">
				<ul className="sidebar-menu">
					{navItems.map((item) => (
						<li key={item.path}>
							{item.path === "/logout" ? (
								<button
									type="button"
									className="sidebar-button"
									onClick={() => handleNavigation(item.path)}
								>
									<item.icon size={22} />
									<span className="sidebar-label">{item.label}</span>
								</button>
							) : (
								<Link
									to={item.path}
									className={`sidebar-button ${isActive(item.path) ? "active" : ""}`}
									preload={item.preload}
									preloadDelay={200}
								>
									<item.icon size={22} />
									<span className="sidebar-label">{item.label}</span>
								</Link>
							)}
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}
