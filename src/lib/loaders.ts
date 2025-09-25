import type {
	BusinessInside,
	BusinessOutside,
	MarketplaceListing,
	Service,
} from "../types/database";
import { supabase } from "./supabase";

export async function getUserServices(userId: string, signal?: AbortSignal) {
	let query = supabase
		.from("user_services")
		.select("*")
		.eq("profile_id", userId)
		.order("created_at", { ascending: false });

	if (signal) {
		query = query.abortSignal(signal);
	}

	const { data, error } = await query;

	if (error) throw error;
	return data || [];
}

export async function getUserBusinessesInside(
	userId: string,
	signal?: AbortSignal,
) {
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
}

export async function getUserBusinessesOutside(
	userId: string,
	signal?: AbortSignal,
) {
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
}

export async function getServices(signal?: AbortSignal) {
	let query = supabase
		.from("user_services")
		.select("*")
		.order("created_at", { ascending: false });

	if (signal) {
		query = query.abortSignal(signal);
	}

	const { data, error } = await query;

	if (error) throw error;
	return data || [];
}

export async function getBusinessesInside(signal?: AbortSignal) {
	let query = supabase
		.from("user_business_inside")
		.select("*")
		.order("created_at", { ascending: false });

	if (signal) {
		query = query.abortSignal(signal);
	}

	const { data, error } = await query;

	if (error) throw error;
	return data || [];
}

export async function getBusinessesOutside(signal?: AbortSignal) {
	let query = supabase
		.from("user_business_outside")
		.select("*")
		.order("created_at", { ascending: false });

	if (signal) {
		query = query.abortSignal(signal);
	}

	const { data, error } = await query;

	if (error) throw error;
	return data || [];
}

export async function getMarketplaceListings(signal?: AbortSignal) {
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
}

export interface ProfileLoaderData {
	userServices: Service[];
	insideBusinesses: BusinessInside[];
	outsideBusinesses: BusinessOutside[];
}

export interface ServicesLoaderData {
	services: Service[];
}

export interface BusinessesLoaderData {
	insideBusinesses: BusinessInside[];
	outsideBusinesses: BusinessOutside[];
}

export interface MarketplaceLoaderData {
	listings: MarketplaceListing[];
}
