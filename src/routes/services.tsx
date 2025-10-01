import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServices } from "../hooks";
import { servicesQueries } from "../hooks/entities/useServices";
import { queryKeys } from "../hooks/utils/queryKeys";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./services.css";

export const Route = createFileRoute("/services")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: Services,
	loader: async ({ context }) => {
		const services = await context.queryClient.ensureQueryData({
			queryKey: queryKeys.services.lists(),
			queryFn: () => servicesQueries.getAll(),
			staleTime: 1000 * 60 * 5, // 5 minutes
		});

		return { services };
	},
	pendingComponent: () => (
		<div className="loading-container">
			<div className="loading-spinner">⏳</div>
			<p>Loading services...</p>
		</div>
	),
	errorComponent: ({ error }) => {
		const navigate = useNavigate();
		const { queryClient } = Route.useRouteContext();

		return (
			<div className="error-container">
				<h2>⚠️ Error Loading Services</h2>
				<p>{error.message}</p>
				<button
					type="button"
					onClick={async () => {
						await queryClient.invalidateQueries({
							queryKey: queryKeys.services.lists(),
						});
						navigate({ to: "/services" });
					}}
				>
					Retry
				</button>
			</div>
		);
	},
});

function Services() {
	// Use optimized hook for services data
	const {
		all: { services },
	} = useServices();

	return (
		<main className="main-content">
			<h2 className="page-title">🔧 Services</h2>

			{services && services.length > 0 ? (
				<div className="services-grid">
					{services.map((service: any) => (
						<div key={service.id} className="service-card">
							<h3 className="service-title">
								{service.description || "Service"}
							</h3>
							{service.price_range && (
								<p className="service-price">💰 {service.price_range}</p>
							)}
							{service.availability && (
								<p className="service-availability">
									⏰ {service.availability}
								</p>
							)}
							{service.is_mobile && (
								<span className="service-badge">📱 Mobile Service</span>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="no-data">No services available yet.</p>
			)}
		</main>
	);
}
