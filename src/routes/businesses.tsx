import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useBusinesses } from "../hooks";
import { businessesQueries } from "../hooks/entities/useBusinesses";
import { queryKeys } from "../hooks/utils/queryKeys";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./businesses.css";

export const Route = createFileRoute("/businesses")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: Businesses,
	loader: async ({ context }) => {
		// Ensure data in TanStack Query cache
		const [insideBusinesses, outsideBusinesses] = await Promise.all([
			context.queryClient.ensureQueryData({
				queryKey: queryKeys.inside.lists(),
				queryFn: () => businessesQueries.getInside(),
				staleTime: 1000 * 60 * 5,
			}),
			context.queryClient.ensureQueryData({
				queryKey: queryKeys.outside.lists(),
				queryFn: () => businessesQueries.getOutside(),
				staleTime: 1000 * 60 * 5,
			}),
		]);

		return { insideBusinesses, outsideBusinesses };
	},
	pendingComponent: () => (
		<div className="loading-container">
			<div className="loading-spinner">⏳</div>
			<p>Loading businesses...</p>
		</div>
	),
	errorComponent: ({ error }) => {
		const navigate = useNavigate();
		const { queryClient } = Route.useRouteContext();

		return (
			<div className="error-container">
				<h2>⚠️ Error Loading Businesses</h2>
				<p>{error.message}</p>
				<button
					type="button"
					onClick={async () => {
						await queryClient.invalidateQueries({
							queryKey: queryKeys.inside.lists(),
						});
						await queryClient.invalidateQueries({
							queryKey: queryKeys.outside.lists(),
						});
						navigate({ to: "/businesses" });
					}}
				>
					Retry
				</button>
			</div>
		);
	},
});

function Businesses() {
	// Use optimized hook for businesses data
	const { insideBusinesses, outsideBusinesses } = useBusinesses().all;

	return (
		<main className="main-content">
			<h2 className="page-title">🏢 Businesses</h2>

			{/* Businesses Inside GGV */}
			{insideBusinesses && insideBusinesses.length > 0 && (
				<div className="businesses-section">
					<h3 className="section-title">Businesses Inside GGV</h3>
					<div className="businesses-grid">
						{insideBusinesses.map((business: any) => (
							<div key={business.id} className="business-card">
								<h4 className="business-name">{business.business_name}</h4>
								{business.description && (
									<p className="business-description">{business.description}</p>
								)}
								{business.phone_number && (
									<p className="business-phone">📞 {business.phone_number}</p>
								)}
								{business.email && (
									<p className="business-email">✉️ {business.email}</p>
								)}
								{business.hours && (
									<p className="business-hours">⏰ {business.hours}</p>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Businesses Outside GGV */}
			{outsideBusinesses && outsideBusinesses.length > 0 && (
				<div className="businesses-section">
					<h3 className="section-title">Businesses Outside Community</h3>
					<div className="businesses-grid">
						{outsideBusinesses.map((business: any) => (
							<div key={business.id} className="business-card">
								<h4 className="business-name">{business.business_name}</h4>
								{business.description && (
									<p className="business-description">{business.description}</p>
								)}
								{business.phone_number && (
									<p className="business-phone">📞 {business.phone_number}</p>
								)}
								{business.email && (
									<p className="business-email">✉️ {business.email}</p>
								)}
								{business.address && (
									<p className="business-address">📍 {business.address}</p>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{(!insideBusinesses || insideBusinesses.length === 0) &&
				(!outsideBusinesses || outsideBusinesses.length === 0) && (
					<p className="no-data">No businesses available yet.</p>
				)}
		</main>
	);
}
