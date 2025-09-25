import { useRouter } from "@tanstack/react-router";

/**
 * Hook pour obtenir le statut de chargement des routes de manière optimisée
 */
export const useRouteStatus = () => {
	const router = useRouter();

	const isLoading = router.state.isLoading;
	const isTransitioning = router.state.isTransitioning;
	const pendingMatches = router.state.pendingMatches;

	return {
		isLoading,
		isTransitioning,
		hasPendingMatches: pendingMatches && pendingMatches.length > 0,
		pendingMatchesCount: pendingMatches?.length || 0,
	};
};

/**
 * Hook pour obtenir les informations de preloading
 */
export const usePreloadStatus = () => {
	const router = useRouter();

	return {
		preloadedRoutes: Object.keys(router.state.cachedMatches || {}),
		preloadedCount: Object.keys(router.state.cachedMatches || {}).length,
	};
};
