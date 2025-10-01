import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	Building,
	Clock,
	Coins,
	Globe,
	Loader,
	MapPin,
	MessageCircle,
	Settings,
} from "lucide-react";

import Avatar from "../components/Avatar";
import { useAuth, useBusinesses, useServices } from "../hooks";

// Import query functions from entity hooks
import { businessesQueries } from "../hooks/entities/useBusinesses";
import { servicesQueries } from "../hooks/entities/useServices";

// Define loader data type
type ProfileLoaderData = {
	userServices: any[];
	insideBusinesses: any[];
	outsideBusinesses: any[];
};
import { queryKeys } from "../hooks/utils/queryKeys";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./profile.css";

export const Route = createFileRoute("/profile")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: Profile,
	loader: async ({ context }): Promise<ProfileLoaderData> => {
		try {
			// Get current session instead of getUser to avoid session missing errors
			const {
				data: { session },
				error,
			} = await context.supabase.auth.getSession();

			if (error || !session?.user) {
				return {
					userServices: [],
					insideBusinesses: [],
					outsideBusinesses: [],
				};
			}

			const user = session.user;

			// Ensure user data in TanStack Query cache
			const [userServices, insideBusinesses, outsideBusinesses] =
				await Promise.all([
					context.queryClient.ensureQueryData({
						queryKey: queryKeys.services.byUser(user.id),
						queryFn: () => servicesQueries.getByUser(user.id),
						staleTime: 1000 * 60 * 5,
					}),
					context.queryClient.ensureQueryData({
						queryKey: queryKeys.userInside.byUser(user.id),
						queryFn: () => businessesQueries.getUserInside(user.id),
						staleTime: 1000 * 60 * 5,
					}),
					context.queryClient.ensureQueryData({
						queryKey: queryKeys.userOutside.byUser(user.id),
						queryFn: () => businessesQueries.getUserOutside(user.id),
						staleTime: 1000 * 60 * 5,
					}),
				]);

			return { userServices, insideBusinesses, outsideBusinesses };
		} catch (error) {
			console.error("Profile loader error:", error);
			return { userServices: [], insideBusinesses: [], outsideBusinesses: [] };
		}
	},
	pendingComponent: () => (
		<div className="loading-container">
			<Loader className="loading-spinner" size={24} />
			<p>Loading profile...</p>
		</div>
	),
	errorComponent: ({ error }) => (
		<div className="error-container">
			<h2>
				<AlertTriangle className="inline-icon" size={20} /> Error Loading
				Profile
			</h2>
			<p>{error.message}</p>
		</div>
	),
});

function Profile() {
	const { user, loading } = useAuth();

	// Use optimized hooks for user data
	const { services: userServices = [] } = useServices().byUser(user?.id || "");
	const { insideBusinesses, outsideBusinesses } = useBusinesses().byUser(
		user?.id || "",
	);

	// If still loading or no user, show loading state
	if (loading || !user) {
		return (
			<main className="main-content">
				<div className="loading-container">
					<div className="loading-spinner">⏳</div>
					<p>Loading profile...</p>
				</div>
			</main>
		);
	}

	return (
		<main className="main-content">
			{/* Profile Header */}
			<div className="profile-header">
				<div className="profile-avatar-section">
					<Avatar size="lg" />
				</div>
				<div className="profile-info-section">
					<p className="profile-username">
						{user.username || user.full_name || "User"}
					</p>
					{user.occupation && (
						<p className="profile-occupation">{user.occupation}</p>
					)}
					{user.coins && (
						<p className="profile-coins">
							<Coins className="inline-icon" size={16} /> {user.coins} coins
						</p>
					)}
				</div>
			</div>

			{/* About Section */}
			{user.description && (
				<div className="profile-section">
					<h2 className="section-title">About</h2>
					<div className="profile-description">{user.description}</div>
				</div>
			)}

			{/* Social Links */}
			{(user.facebook_url ||
				user.messenger_url ||
				user.viber_number ||
				user.whatsapp_number ||
				user.website) && (
				<div className="profile-section">
					<h2 className="section-title">Connect</h2>
					<div className="social-links">
						{user.facebook_url && (
							<a
								href={user.facebook_url}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
							>
								<img
									src="/src/assets/logos/facebook.png"
									alt="Facebook"
									className="social-logo"
								/>{" "}
								Facebook
							</a>
						)}
						{user.messenger_url && (
							<a
								href={user.messenger_url}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
							>
								<MessageCircle className="inline-icon" size={16} /> Messenger
							</a>
						)}
						{user.viber_number && (
							<a
								href={`viber://chat?number=${user.viber_number}`}
								className="social-link"
							>
								<img
									src="/src/assets/logos/viber.png"
									alt="Viber"
									className="social-logo"
								/>{" "}
								Viber
							</a>
						)}
						{user.whatsapp_number && (
							<a
								href={`https://wa.me/${user.whatsapp_number}`}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
							>
								<img
									src="/src/assets/logos/whatsapp.png"
									alt="WhatsApp"
									className="social-logo"
								/>{" "}
								WhatsApp
							</a>
						)}
						{user.website && (
							<a
								href={user.website}
								target="_blank"
								rel="noopener noreferrer"
								className="social-link"
							>
								<Globe className="inline-icon" size={16} /> Website
							</a>
						)}
					</div>
				</div>
			)}

			{/* Services Section */}
			{userServices && userServices.length > 0 && (
				<div className="profile-section">
					<h2 className="section-title">
						<Settings className="inline-icon" size={20} /> My Services
					</h2>
					<div className="services-list">
						{userServices.map((service: any) => (
							<div key={service.id} className="service-item">
								<h3 className="service-name">
									{service.description || "Service"}
								</h3>
								{service.price_range && (
									<p className="service-price">
										<Coins className="inline-icon" size={14} />{" "}
										{service.price_range}
									</p>
								)}
								{service.availability && (
									<p className="service-availability">
										<Clock className="inline-icon" size={14} />{" "}
										{service.availability}
									</p>
								)}
								{service.is_mobile && (
									<span className="service-badge">
										<MessageCircle className="inline-icon" size={14} /> Mobile
										Service
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Businesses Inside GGV */}
			{insideBusinesses && insideBusinesses.length > 0 && (
				<div className="profile-section">
					<h2 className="section-title">
						<Building className="inline-icon" size={20} /> My Businesses (In
						GGV)
					</h2>
					<div className="businesses-list">
						{insideBusinesses.map((business: any) => (
							<div key={business.id} className="business-item">
								<h3 className="business-name">{business.business_name}</h3>
								{business.description && (
									<p className="business-description">{business.description}</p>
								)}
								{business.phone_number && (
									<p className="business-phone">
										<MessageCircle className="inline-icon" size={14} />{" "}
										{business.phone_number}
									</p>
								)}
								{business.email && (
									<p className="business-email">✉️ {business.email}</p>
								)}
								{business.hours && (
									<p className="business-hours">
										<Clock className="inline-icon" size={14} /> {business.hours}
									</p>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Businesses Outside GGV */}
			{outsideBusinesses && outsideBusinesses.length > 0 && (
				<div className="profile-section">
					<h2 className="section-title">
						🌐 My Businesses (Outside Community)
					</h2>
					<div className="businesses-list">
						{outsideBusinesses.map((business: any) => (
							<div key={business.id} className="business-item">
								<h3 className="business-name">{business.business_name}</h3>
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
									<p className="business-address">
										<MapPin className="inline-icon" size={14} />{" "}
										{business.address}
									</p>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</main>
	);
}
