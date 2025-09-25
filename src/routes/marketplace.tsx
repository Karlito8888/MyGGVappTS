import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMarketplaceListings } from "../hooks/useMarketplace";
import { marketplaceQueries } from "../lib/queryFunctions";
import { queryKeys } from "../lib/queryKeys";
import { queryClient } from "../providers/QueryClientProvider";
import "./marketplace.css";

export const Route = createFileRoute("/marketplace")({
	component: Marketplace,
	loader: async ({ abortController }) => {
		// Ensure data in TanStack Query cache
		const listings = await queryClient.ensureQueryData({
			queryKey: queryKeys.marketplace.listings(),
			queryFn: ({ signal }) =>
				marketplaceQueries.getListings(signal || abortController.signal),
			staleTime: 1000 * 60 * 3, // 3 minutes
		});

		return { listings };
	},
	pendingComponent: () => (
		<div className="loading-container">
			<div className="loading-spinner">⏳</div>
			<p>Loading marketplace...</p>
		</div>
	),
	errorComponent: ({ error }) => {
		const navigate = useNavigate();
		return (
			<div className="error-container">
				<h2>⚠️ Error Loading Marketplace</h2>
				<p>{error.message}</p>
				<button
					type="button"
					onClick={() => navigate({ to: "/marketplace", replace: true })}
				>
					Retry
				</button>
			</div>
		);
	},
});

function Marketplace() {
	// Use optimized hook for marketplace data
	const { data: listings = [] } = useMarketplaceListings();

	return (
		<main className="main-content">
			<h2 className="page-title">🛒 Marketplace</h2>

			{listings && listings.length > 0 ? (
				<div className="marketplace-grid">
					{listings.map((listing) => (
						<div key={listing.id} className="listing-card">
							<h3 className="listing-title">{listing.title}</h3>
							{listing.description && (
								<p className="listing-description">{listing.description}</p>
							)}
							<p className="listing-price">
								💰 {listing.price} {listing.currency}
							</p>
							<span className={`listing-type ${listing.listing_type}`}>
								{listing.listing_type === "selling"
									? "📤 Selling"
									: "📥 Buying"}
							</span>
							{listing.category && (
								<p className="listing-category">📁 {listing.category}</p>
							)}
							<span className={`listing-status ${listing.status}`}>
								{listing.status}
							</span>
						</div>
					))}
				</div>
			) : (
				<p className="no-data">No marketplace listings available yet.</p>
			)}
		</main>
	);
}
