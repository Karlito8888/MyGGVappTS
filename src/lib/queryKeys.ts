// Centralized query keys for consistent caching
export const queryKeys = {
	// Auth
	auth: {
		all: ["auth"] as const,
		user: () => [...queryKeys.auth.all, "user"] as const,
		profile: (userId: string) =>
			[...queryKeys.auth.all, "profile", userId] as const,
	},

	// Profiles
	profiles: {
		all: ["profiles"] as const,
		lists: () => [...queryKeys.profiles.all, "list"] as const,
		list: (filters?: string) =>
			[...queryKeys.profiles.lists(), { filters }] as const,
		details: () => [...queryKeys.profiles.all, "detail"] as const,
		detail: (id: string) => [...queryKeys.profiles.details(), id] as const,
	},

	// Services
	services: {
		all: ["services"] as const,
		lists: () => [...queryKeys.services.all, "list"] as const,
		user: (userId: string) =>
			[...queryKeys.services.all, "user", userId] as const,
	},

	// Businesses
	businesses: {
		all: ["businesses"] as const,
		inside: () => [...queryKeys.businesses.all, "inside"] as const,
		outside: () => [...queryKeys.businesses.all, "outside"] as const,
		userInside: (userId: string) =>
			[...queryKeys.businesses.inside(), "user", userId] as const,
		userOutside: (userId: string) =>
			[...queryKeys.businesses.outside(), "user", userId] as const,
	},

	// Marketplace
	marketplace: {
		all: ["marketplace"] as const,
		listings: () => [...queryKeys.marketplace.all, "listings"] as const,
		listing: (id: string) =>
			[...queryKeys.marketplace.all, "listing", id] as const,
	},

	// Messages
	messages: {
		all: ["messages"] as const,
		headers: () => [...queryKeys.messages.all, "headers"] as const,
		active: () => [...queryKeys.messages.headers(), "active"] as const,
		byUser: (userId: string) =>
			[...queryKeys.messages.all, "user", userId] as const,
	},

	// Locations
	locations: {
		all: ["locations"] as const,
		list: () => [...queryKeys.locations.all, "list"] as const,
		associations: (userId: string) =>
			[...queryKeys.locations.all, "associations", userId] as const,
	},

	// Forums
	forums: {
		all: ["forums"] as const,
		list: () => [...queryKeys.forums.all, "list"] as const,
		detail: (id: string) => [...queryKeys.forums.all, "detail", id] as const,
	},
} as const;
