import type {
	BusinessInside,
	BusinessOutside,
	MarketplaceListing,
	MessagesHeader,
	Profile,
	Service,
} from "../types/database";
import { supabase } from "./supabase";

// Auth queries
export const authQueries = {
	getUser: async () => {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();
		if (error) throw error;
		return user;
	},

	getProfile: async (userId: string): Promise<Profile | null> => {
		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) {
			if (error.code === "PGRST116") return null; // Not found
			if (error.code === "42501") return null; // RLS permission denied
			throw error;
		}
		return data;
	},
};

// Services queries
export const servicesQueries = {
	getAll: async (signal?: AbortSignal): Promise<Service[]> => {
		let query = supabase
			.from("user_services")
			.select(`
				*,
				service_categories!inner (
					id,
					name,
					is_active
				)
			`)
			.eq("user_services.is_active", true)
			.eq("service_categories.is_active", true)
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},

	getByUser: async (
		userId: string,
		signal?: AbortSignal,
	): Promise<Service[]> => {
		let query = supabase
			.from("user_services")
			.select(`
				*,
				service_categories!inner (
					id,
					name,
					is_active
				)
			`)
			.eq("profile_id", userId)
			.eq("user_services.is_active", true)
			.eq("service_categories.is_active", true)
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},
};

// Businesses queries
export const businessesQueries = {
	getInside: async (signal?: AbortSignal): Promise<BusinessInside[]> => {
		let query = supabase
			.from("user_business_inside")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},

	getOutside: async (signal?: AbortSignal): Promise<BusinessOutside[]> => {
		let query = supabase
			.from("user_business_outside")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},

	getUserInside: async (
		userId: string,
		signal?: AbortSignal,
	): Promise<BusinessInside[]> => {
		let query = supabase
			.from("user_business_inside")
			.select("*")
			.eq("profile_id", userId)
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},

	getUserOutside: async (
		userId: string,
		signal?: AbortSignal,
	): Promise<BusinessOutside[]> => {
		let query = supabase
			.from("user_business_outside")
			.select("*")
			.eq("profile_id", userId)
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},
};

// Marketplace queries
export const marketplaceQueries = {
	getListings: async (signal?: AbortSignal): Promise<MarketplaceListing[]> => {
		let query = supabase
			.from("marketplace_listings")
			.select("*")
			.order("created_at", { ascending: false });

		if (signal) {
			query = query.abortSignal(signal);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},
};

// Messages queries
export const messagesQueries = {
	getHeaders: async (): Promise<MessagesHeader[]> => {
		const { data, error } = await supabase
			.from("messages_header")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	getActiveHeaders: async (): Promise<MessagesHeader[]> => {
		const { data, error } = await supabase
			.from("messages_header")
			.select(`
				*,
				profiles:user_id (
					username,
					avatar_url
				)
			`)
			.or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	getUserHeaders: async (userId: string): Promise<MessagesHeader[]> => {
		const { data, error } = await supabase
			.from("messages_header")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	createHeader: async (
		header: Omit<MessagesHeader, "id" | "created_at" | "updated_at">,
	): Promise<MessagesHeader> => {
		const { data, error } = await supabase
			.from("messages_header")
			.insert([header])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	updateHeader: async (
		id: string,
		updates: Partial<MessagesHeader>,
	): Promise<MessagesHeader> => {
		const { data, error } = await supabase
			.from("messages_header")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	deleteHeader: async (id: string): Promise<void> => {
		const { error } = await supabase
			.from("messages_header")
			.delete()
			.eq("id", id);

		if (error) throw error;
	},
};

// Profiles queries
export const profilesQueries = {
	getAll: async (): Promise<Profile[]> => {
		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			// Handle RLS-specific errors
			if (error.code === "42501") {
				console.warn("RLS: Access denied to profiles list");
				return [];
			}
			throw error;
		}
		return data || [];
	},

	getById: async (id: string): Promise<Profile | null> => {
		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") return null; // Not found
			if (error.code === "42501") return null; // RLS permission denied
			throw error;
		}
		return data;
	},
};
