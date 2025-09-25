import "./footer.css";

export default function Footer() {
	return (
		<footer className="footer">
			<div className="footer-content">
				<p>&copy; {new Date().getFullYear()} Garden Grove Village</p>
			</div>
		</footer>
	);
}
