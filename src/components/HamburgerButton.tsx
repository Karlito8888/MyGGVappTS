import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useDraggable } from "../hooks/utility/useDraggable";

interface HamburgerButtonProps {
	onClick: () => void;
	enableDrag?: boolean;
}

export default function HamburgerButton({
	onClick,
	enableDrag = true,
}: HamburgerButtonProps) {
	const [bounds, setBounds] = useState({
		left: 16,
		right: typeof window !== "undefined" ? window.innerWidth - 72 : 1000,
		top: 16,
		bottom: typeof window !== "undefined" ? window.innerHeight - 72 : 1000,
	});

	// Update bounds on window resize
	useEffect(() => {
		const updateBounds = () => {
			setBounds({
				left: 16,
				right: window.innerWidth - 72,
				top: 16,
				bottom: window.innerHeight - 72,
			});
		};

		updateBounds();
		window.addEventListener("resize", updateBounds);
		return () => window.removeEventListener("resize", updateBounds);
	}, []);

	const { position, isDragging, handleMouseDown, handleTouchStart } =
		useDraggable({
			initialPosition: { x: 16, y: window.innerHeight - 88 },
			storageKey: "hamburger-button-position",
			bounds,
			onDragStart: () => {
				document.body.style.pointerEvents = "none";
			},
			onDragEnd: () => {
				document.body.style.pointerEvents = "";
			},
		});

	const buttonStyle: React.CSSProperties = enableDrag
		? {
				position: "fixed",
				left: `${position.x}px`,
				top: `${position.y}px`,
				bottom: "auto",
				cursor: isDragging ? "grabbing" : "grab",
				zIndex: 1000,
			}
		: {};

	const handleClick = (e: React.MouseEvent) => {
		if (!isDragging) {
			e.preventDefault();
			e.stopPropagation();
			onClick();
		}
	};

	return (
		<button
			type="button"
			className={`hamburger-button ${enableDrag ? "hamburger-button--draggable" : ""} ${isDragging ? "hamburger-button--dragging" : ""}`}
			onClick={enableDrag ? handleClick : onClick}
			onMouseDown={enableDrag ? handleMouseDown : undefined}
			onTouchStart={enableDrag ? handleTouchStart : undefined}
			aria-label="Open menu"
			aria-describedby={enableDrag ? "hamburger-drag-hint" : undefined}
			style={enableDrag ? buttonStyle : undefined}
			title={enableDrag ? "Drag to reposition" : "Open menu"}
		>
			<Menu size={24} />
			{enableDrag && (
				<span id="hamburger-drag-hint" className="visually-hidden">
					Drag to reposition this button
				</span>
			)}
		</button>
	);
}
