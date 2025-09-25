import { useCallback, useEffect, useState } from "react";
import { useActiveMessagesHeaders } from "../hooks/useMessagesHeaders";
import "./header.css";

const Header = () => {
	const { data: messages = [] } = useActiveMessagesHeaders();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);
	const [currentGradient, setCurrentGradient] = useState("");

	const displayMessages =
		messages.length > 0
			? messages
			: [{ message: "Welcome to our community! 🌟" }];

	const getRandomGradient = useCallback(() => {
		const colorPalette = ["#f3c549", "#ffff7b"];
		const angle = Math.floor(Math.random() * 360);
		const color1 =
			colorPalette[Math.floor(Math.random() * colorPalette.length)];
		let color2 = colorPalette[Math.floor(Math.random() * colorPalette.length)];

		while (color2 === color1) {
			color2 = colorPalette[Math.floor(Math.random() * colorPalette.length)];
		}

		return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
	}, []);

	useEffect(() => {
		// Initialiser le premier gradient
		setCurrentGradient(getRandomGradient());
	}, [getRandomGradient]);

	useEffect(() => {
		if (displayMessages.length <= 1) return;

		const interval = setInterval(() => {
			setIsVisible(false);

			setTimeout(() => {
				setCurrentIndex(
					(prevIndex) => (prevIndex + 1) % displayMessages.length,
				);
				setCurrentGradient(getRandomGradient());
				setIsVisible(true);
			}, 300); // Durée du fondu
		}, 5000);

		return () => clearInterval(interval);
	}, [displayMessages.length, getRandomGradient]);

	const currentMessage = displayMessages[currentIndex] || displayMessages[0];

	return (
		<>
			<header
				className="app-header"
				style={{
					background: currentGradient,
				}}
			>
				<div className="app-header__content">
					<span
						className={`app-header__message ${isVisible ? "u-opacity-100" : "u-opacity-0"}`}
					>
						{currentMessage.message}
					</span>
				</div>
			</header>
		</>
	);
};

export default Header;
