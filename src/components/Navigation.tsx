import { Link, useLocation, useNavigate } from "@tanstack/react-router";
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
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks";
import HamburgerButton from "./HamburgerButton";
import "./navigation.css";

export default function Navigation() {
	const location = useLocation();
	const currentPath = location.pathname;
	const [isOpen, setIsOpen] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [animationState, setAnimationState] = useState<
		"closed" | "opening" | "open" | "closing"
	>("closed");
	const sidebarRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const { signOut } = useAuth();

	// Gestion du clavier (Escape pour fermer)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isOpen && !isAnimating) {
				// Fermeture douce pour Escape
				setAnimationState("closing");
				setIsAnimating(true);
				setTimeout(() => {
					setIsOpen(false);
					setAnimationState("closed");
					setIsAnimating(false);
				}, 350);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isAnimating]);

	// Empêcher le scroll du body quand la modale est ouverte - Version améliorée
	useEffect(() => {
		if (isOpen && !isAnimating) {
			// Sauvegarder la position de défilement actuelle
			const scrollY = window.scrollY;
			document.body.style.overflow = "hidden";
			document.body.style.position = "fixed";
			document.body.style.width = "100%";
			document.body.style.height = "100%";
			document.body.style.top = `-${scrollY}px`;

			// Stocker la position pour la restauration
			(document.body as any).dataset.scrollY = scrollY.toString();
		} else if (!isOpen) {
			// Restaurer la position de défilement
			const scrollY = (document.body as any).dataset.scrollY || "0";
			document.body.style.overflow = "";
			document.body.style.position = "";
			document.body.style.width = "";
			document.body.style.height = "";
			document.body.style.top = "";

			// Restaurer le défilement seulement si on a une position sauvegardée
			if (scrollY && scrollY !== "0") {
				window.scrollTo(0, Number.parseInt(scrollY, 10));
			}
		}

		return () => {
			// Nettoyage complet
			document.body.style.overflow = "";
			document.body.style.position = "";
			document.body.style.width = "";
			document.body.style.height = "";
			document.body.style.top = "";
		};
	}, [isOpen, isAnimating]);

	// Gestion améliorée des événements tactiles pour éviter les warnings
	useEffect(() => {
		const handleTouchMove = (e: TouchEvent) => {
			if (isOpen && !isAnimating && e.cancelable) {
				const target = e.target as HTMLElement;
				const isInsideSidebar = target.closest(".sidebar");
				const isOverlay = target.closest(".sidebar-overlay");

				// Bloquer uniquement les touches en dehors de la sidebar et de l'overlay
				if (!isInsideSidebar && !isOverlay) {
					e.preventDefault();
				}
			}
		};

		if (isOpen) {
			document.addEventListener("touchmove", handleTouchMove, {
				passive: false,
			});
		}

		return () => {
			document.removeEventListener("touchmove", handleTouchMove);
		};
	}, [isOpen, isAnimating]);

	const handleNavigation = useCallback(
		(path: string) => {
			if (path === "/logout") {
				const handleLogout = async () => {
					try {
						await signOut();
						navigate({ to: "/auth" });
					} catch (error) {
						console.error("Logout error:", error);
					}
				};
				handleLogout();
				// Fermeture douce pour la navigation
				setAnimationState("closing");
				setIsAnimating(true);
				setTimeout(() => {
					setIsOpen(false);
					setAnimationState("closed");
					setIsAnimating(false);
				}, 350);
				return;
			}
			navigate({ to: path });
			// Fermeture douce pour la navigation
			setAnimationState("closing");
			setIsAnimating(true);
			setTimeout(() => {
				setIsOpen(false);
				setAnimationState("closed");
				setIsAnimating(false);
			}, 350);
		},
		[signOut, navigate],
	);

	const toggleMenu = useCallback(async () => {
		if (isAnimating) return;

		if (isOpen) {
			// Fermeture douce
			setAnimationState("closing");
			setIsAnimating(true);
			await new Promise((resolve) => setTimeout(resolve, 350));
			setIsOpen(false);
			setAnimationState("closed");
			setIsAnimating(false);
		} else {
			// Ouverture rapide
			setIsOpen(true);
			setAnimationState("opening");
			setIsAnimating(true);
			await new Promise((resolve) => setTimeout(resolve, 250));
			setAnimationState("open");
			setIsAnimating(false);
		}
	}, [isOpen, isAnimating]);

	// Gestion du focus pour l'accessibilité
	useEffect(() => {
		if (isOpen && sidebarRef.current) {
			const firstFocusable = sidebarRef.current.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			) as HTMLElement;
			firstFocusable?.focus();
		}
	}, [isOpen]);

	const isActive = useCallback(
		(path: string) => {
			// Root path must match exactly
			if (path === "/") return currentPath === "/";
			// Other paths match if current path starts with them
			return currentPath === path || currentPath.startsWith(`${path}/`);
		},
		[currentPath],
	);

	const navItems = useMemo(
		() => [
			{ path: "/", label: "Home", icon: Home },
			{ path: "/messages", label: "Messages", icon: MessageSquare },
			{ path: "/info", label: "Info", icon: Info },
			{ path: "/marketplace", label: "Marketplace", icon: ShoppingCart },
			{ path: "/games", label: "Games", icon: Gamepad2 },
			{ path: "/coins", label: "Coins", icon: Coins },
			{ path: "/weather", label: "Weather", icon: Cloud },
			{ path: "/posts", label: "Posts", icon: FileText },
			{ path: "/profile", label: "Profile", icon: User },
			{ path: "/logout", label: "Logout", icon: LogOut },
		],
		[],
	);

	return (
		<>
			<HamburgerButton onClick={toggleMenu} enableDrag={true} />

			{/* Overlay */}
			{isOpen && (
				<div
					className="sidebar-overlay"
					data-state={animationState}
					onClick={() => {
						if (!isAnimating) {
							setAnimationState("closing");
							setIsAnimating(true);
							setTimeout(() => {
								setIsOpen(false);
								setAnimationState("closed");
								setIsAnimating(false);
							}, 350);
						}
					}}
					onKeyDown={(event) => {
						if ((event.key === "Enter" || event.key === " ") && !isAnimating) {
							setAnimationState("closing");
							setIsAnimating(true);
							setTimeout(() => {
								setIsOpen(false);
								setAnimationState("closed");
								setIsAnimating(false);
							}, 350);
						}
					}}
					role="button"
					tabIndex={0}
				/>
			)}

			{/* Sidebar modale */}
			{isOpen && (
				<div
					ref={sidebarRef}
					className={`sidebar ${animationState === "open" ? "sidebar-open" : ""}`}
					data-state={animationState}
					aria-labelledby="sidebar-title"
					aria-modal="true"
				>
					<div className="sidebar-header">
						<h2 id="sidebar-title">Menu</h2>
						<button
							type="button"
							className="close-button"
							onClick={() => {
								if (!isAnimating) {
									setAnimationState("closing");
									setIsAnimating(true);
									setTimeout(() => {
										setIsOpen(false);
										setAnimationState("closed");
										setIsAnimating(false);
									}, 350);
								}
							}}
							aria-label="Close menu"
						>
							<X size={24} />
						</button>
					</div>
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
											onClick={() => {
												if (!isAnimating) {
													setAnimationState("closing");
													setIsAnimating(true);
													setTimeout(() => {
														setIsOpen(false);
														setAnimationState("closed");
														setIsAnimating(false);
													}, 350);
												}
											}}
										>
											<item.icon size={22} />
											<span className="sidebar-label">{item.label}</span>
										</Link>
									)}
								</li>
							))}
						</ul>
					</nav>
				</div>
			)}
		</>
	);
}
