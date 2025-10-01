import { useEffect, useState } from "react";

export const useMinLoadingTime = (isLoading: boolean, minTime = 1000) => {
	const [showLoader, setShowLoader] = useState(false);
	const [startTime, setStartTime] = useState(0);

	useEffect(() => {
		if (isLoading && !showLoader) {
			setShowLoader(true);
			setStartTime(Date.now());
		} else if (!isLoading && showLoader) {
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, minTime - elapsed);

			setTimeout(() => {
				setShowLoader(false);
			}, remaining);
		}
	}, [isLoading, showLoader, startTime, minTime]);

	return showLoader;
};
