import { ClimbingBoxLoader } from "react-spinners";
import "./loading.css";

interface LoadingProps {
	isVisible?: boolean;
}

export default function Loading({ isVisible = true }: LoadingProps) {
	return (
		<div className={`loading-container ${!isVisible ? "fade-out" : ""}`}>
			<ClimbingBoxLoader
				color="#3498db"
				size={25}
				loading={true}
				cssOverride={{
					display: "block",
					margin: "0 auto",
				}}
			/>
		</div>
	);
}
