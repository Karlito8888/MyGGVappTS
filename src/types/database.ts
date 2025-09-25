export interface Profile {
	id: string;
	full_name?: string;
	username?: string;
	email?: string;
	avatar_url?: string;
	description?: string;
	occupation?: string;
	facebook_url?: string;
	messenger_url?: string;
	viber_number?: string;
	whatsapp_number?: string;
	coins: number;
	website?: string;
	is_admin: boolean;
	updated_at?: string;
	onboarding_completed: boolean;
	is_online: boolean;
	last_seen: string;
	created_at: string;
	deleted_at?: string;
	last_daily_checkin?: string;
}

export interface Location {
	id: string;
	block: string;
	lot: string;
	coordinates: { lat: number; lng: number } | string;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
	is_locked: boolean;
	marker_url: string;
}

export interface BusinessInside {
	id: string;
	profile_id: string;
	category_id: string;
	business_name: string;
	description?: string;
	email?: string;
	website_url?: string;
	photo_1_url?: string;
	photo_2_url?: string;
	photo_3_url?: string;
	photo_4_url?: string;
	photo_5_url?: string;
	is_active: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	location_id?: string;
	phone_number?: string;
	phone_type?: "landline" | "mobile" | "viber" | "whatsapp";
	hours?: string;
	facebook_url?: string;
	block?: string;
	lot?: string;
}

export interface BusinessOutside {
	id: string;
	profile_id: string;
	category_id: string;
	business_name: string;
	description?: string;
	phone_number?: string;
	email?: string;
	website_url?: string;
	address?: string;
	city?: string;
	postal_code?: string;
	province?: string;
	photo_1_url?: string;
	photo_2_url?: string;
	photo_3_url?: string;
	photo_4_url?: string;
	photo_5_url?: string;
	is_active: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	barangay?: string;
	google_maps_link?: string;
	hours?: string;
	facebook_url?: string;
	phone_type?: string;
}

export interface Service {
	id: string;
	profile_id: string;
	category_id: string;
	description?: string;
	price_range?: string;
	availability?: string;
	is_mobile: boolean;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	location_id?: string;
	service_location_type?: "at_provider" | "mobile" | "both";
	photo_1_url?: string;
	photo_2_url?: string;
	photo_3_url?: string;
	photo_4_url?: string;
	photo_5_url?: string;
	facebook_url?: string;
	block?: string;
	lot?: string;
	service_categories?: {
		id: string;
		name: string;
		is_active: boolean;
	};
}

export interface MarketplaceListing {
	id: string;
	profile_id: string;
	title: string;
	description?: string;
	price: number;
	currency: "PHP" | "USD";
	listing_type: "selling" | "buying";
	category?: string;
	location_description?: string;
	contact_method: "phone" | "message" | "both";
	photo_1_url?: string;
	photo_2_url?: string;
	photo_3_url?: string;
	photo_4_url?: string;
	photo_5_url?: string;
	is_active: boolean;
	is_featured: boolean;
	status: "available" | "pending" | "sold" | "expired";
	created_at: string;
	updated_at: string;
	expires_at?: string;
}

export interface Forum {
	id: string;
	title: string;
	description?: string;
	icon?: string;
	created_at: string;
	created_by?: string;
}

export interface Thread {
	id: string;
	forum_id?: string;
	title: string;
	created_by?: string;
	created_at: string;
}

export interface Chat {
	id: string;
	channel_id: string;
	user_id?: string;
	content: string;
	created_at: string;
	updated_at: string;
	is_edited: boolean;
	reply_to?: string;
}

export interface PrivateMessage {
	id: string;
	sender_id: string;
	receiver_id: string;
	message: string;
	read_at?: string;
	created_at: string;
	updated_at: string;
	deleted_at?: string;
	attachment_url?: string;
	attachment_type?: string;
	message_type: "text" | "image" | "file" | "location";
	reply_to?: string;
	is_edited: boolean;
}

export interface Association {
	id: string;
	created_at: string;
	name: string;
	description: string;
	category: string;
	image_url: string;
	website: string;
	phone: string;
	email: string;
	address: string;
	is_active: boolean;
}

export interface AssociationMember {
	id: string;
	created_at: string;
	association_id: string;
	user_id: string;
	role: string;
	joined_at: string;
}

export interface Event {
	id: string;
	created_at: string;
	title: string;
	description: string;
	start_date: string;
	end_date: string;
	location: string;
	image_url: string;
	is_active: boolean;
	association_id: string;
}

export interface EventParticipant {
	id: string;
	created_at: string;
	event_id: string;
	user_id: string;
	status: string;
}

export interface Announcement {
	id: string;
	created_at: string;
	title: string;
	content: string;
	is_active: boolean;
	association_id: string;
}

export interface Document {
	id: string;
	created_at: string;
	title: string;
	description: string;
	file_url: string;
	file_type: string;
	file_size: number;
	is_active: boolean;
	association_id: string;
}

export interface Vote {
	id: string;
	created_at: string;
	title: string;
	description: string;
	start_date: string;
	end_date: string;
	is_active: boolean;
	association_id: string;
}

export interface VoteOption {
	id: string;
	created_at: string;
	title: string;
	description: string;
	vote_id: string;
}

export interface VoteResult {
	id: string;
	created_at: string;
	vote_id: string;
	user_id: string;
	vote_option_id: string;
}

export interface BusinessInsideCategory {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface BusinessOutsideCategory {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface ServiceCategory {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProfileLocationAssociation {
	id: number;
	location_id?: string;
	is_verified: boolean;
	is_owner: boolean;
	profile_id: string;
}

export interface LocationAssociationRequest {
	id: number;
	approver_id?: string;
	requester_id: string;
	location_id: string;
	status: "pending" | "approved" | "rejected";
	created_at: string;
	approved_at?: string;
	rejected_at?: string;
}

export interface ConversationCleanupNotification {
	id: string;
	user_id: string;
	notification_sent_at: string;
	cleanup_scheduled_at: string;
	conversations_count: number;
	is_acknowledged: boolean;
	created_at: string;
}

export interface ConversationDeletion {
	id: string;
	user_id: string;
	participant_id: string;
	deleted_at: string;
	last_message_id?: string;
	created_at: string;
}

export interface MessagesHeader {
	id: string;
	user_id?: string;
	message: string;
	created_at: string;
	updated_at: string;
	coins_spent: number;
	expires_at?: string;
}
