import { useCallback, useEffect, useRef, useState } from "react";

interface Position {
	x: number;
	y: number;
}

interface UseDraggableOptions {
	initialPosition?: Position;
	bounds?: {
		left?: number;
		right?: number;
		top?: number;
		bottom?: number;
	};
	storageKey?: string;
	onDragStart?: () => void;
	onDragEnd?: () => void;
}

interface UseDraggableReturn {
	position: Position;
	isDragging: boolean;
	handleMouseDown: (e: React.MouseEvent) => void;
	handleTouchStart: (e: React.TouchEvent) => void;
}

export function useDraggable({
	initialPosition = { x: 16, y: 16 },
	bounds = {},
	storageKey,
	onDragStart,
	onDragEnd,
}: UseDraggableOptions = {}): UseDraggableReturn {
	const [position, setPosition] = useState<Position>(initialPosition);
	const [isDragging, setIsDragging] = useState(false);
	const dragStartPos = useRef<Position>({ x: 0, y: 0 });
	const elementStartPos = useRef<Position>({ x: 0, y: 0 });

	// Load saved position from localStorage
	useEffect(() => {
		if (storageKey) {
			try {
				const savedPosition = localStorage.getItem(storageKey);
				if (savedPosition) {
					const parsed = JSON.parse(savedPosition);
					if (
						parsed &&
						typeof parsed.x === "number" &&
						typeof parsed.y === "number"
					) {
						setPosition(parsed);
					}
				}
			} catch (error) {
				console.warn("Failed to load saved position:", error);
			}
		}
	}, [storageKey]);

	// Save position to localStorage
	const savePosition = useCallback(
		(newPosition: Position) => {
			if (storageKey) {
				try {
					localStorage.setItem(storageKey, JSON.stringify(newPosition));
				} catch (error) {
					console.warn("Failed to save position:", error);
				}
			}
		},
		[storageKey],
	);

	// Constrain position within bounds
	const constrainPosition = useCallback(
		(pos: Position): Position => {
			let { x, y } = pos;

			if (bounds.left !== undefined && x < bounds.left) x = bounds.left;
			if (bounds.right !== undefined && x > bounds.right) x = bounds.right;
			if (bounds.top !== undefined && y < bounds.top) y = bounds.top;
			if (bounds.bottom !== undefined && y > bounds.bottom) y = bounds.bottom;

			return { x, y };
		},
		[bounds],
	);

	const handleDragStart = useCallback(
		(clientX: number, clientY: number) => {
			setIsDragging(true);
			dragStartPos.current = { x: clientX, y: clientY };
			elementStartPos.current = { ...position };
			onDragStart?.();

			// Prevent text selection during drag
			document.body.style.userSelect = "none";
			document.body.style.touchAction = "none";
		},
		[position, onDragStart],
	);

	const handleDragMove = useCallback(
		(clientX: number, clientY: number) => {
			if (!isDragging) return;

			const deltaX = clientX - dragStartPos.current.x;
			const deltaY = clientY - dragStartPos.current.y;

			const newPosition = constrainPosition({
				x: elementStartPos.current.x + deltaX,
				y: elementStartPos.current.y + deltaY,
			});

			setPosition(newPosition);
		},
		[isDragging, constrainPosition],
	);

	const handleDragEnd = useCallback(() => {
		if (!isDragging) return;

		setIsDragging(false);
		savePosition(position);
		onDragEnd?.();

		// Restore normal selection behavior
		document.body.style.userSelect = "";
		document.body.style.touchAction = "";
	}, [isDragging, position, savePosition, onDragEnd]);

	// Mouse events
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button === 0) {
				e.preventDefault();
			}
			handleDragStart(e.clientX, e.clientY);
		},
		[handleDragStart],
	);

	// Touch events
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.touches[0];
			handleDragStart(touch.clientX, touch.clientY);
		},
		[handleDragStart],
	);

	// Global event listeners
	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			handleDragMove(e.clientX, e.clientY);
		};

		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			const touch = e.touches[0];
			handleDragMove(touch.clientX, touch.clientY);
		};

		const handleMouseUp = () => {
			handleDragEnd();
		};

		const handleTouchEnd = () => {
			handleDragEnd();
		};

		// Add event listeners
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("touchmove", handleTouchMove, { passive: false });
		document.addEventListener("touchend", handleTouchEnd);

		// Cleanup
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);

			// Restore normal selection behavior on cleanup
			document.body.style.userSelect = "";
			document.body.style.touchAction = "";
		};
	}, [isDragging, handleDragMove, handleDragEnd]);

	return {
		position,
		isDragging,
		handleMouseDown,
		handleTouchStart,
	};
}
