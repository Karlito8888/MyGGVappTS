import { useMinLoadingTime } from "../hooks/utility/useMinLoadingTime";
import Loading from "./Loading";

interface PageLoadingProps {
	isLoading: boolean;
	children?: React.ReactNode;
}

export default function PageLoading({ isLoading, children }: PageLoadingProps) {
	const showLoader = useMinLoadingTime(isLoading, 800);

	return (
		<main className="main-content" style={{ position: "relative" }}>
			{children}
			{showLoader && <Loading isVisible={true} />}
		</main>
	);
}
