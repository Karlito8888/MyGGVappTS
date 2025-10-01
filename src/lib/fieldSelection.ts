/**
 * Selective field loading system for data optimization
 * Allows loading only necessary fields based on usage context
 */

/**
 * Field selection presets for common use cases
 */
export const FIELD_PRESETS = {
	// Minimal fields for list views and cards
	MINIMAL: "minimal",
	// Essential fields for detail views
	ESSENTIAL: "essential",
	// All fields for edit forms and complete views
	COMPLETE: "complete",
	// Custom field selection
	CUSTOM: "custom",
} as const;

export type FieldPreset = keyof typeof FIELD_PRESETS;

/**
 * Field selection configuration interface
 */
export interface FieldSelectionConfig {
	preset: FieldPreset;
	customFields?: string[];
	excludeFields?: string[];
	includeRelations?: boolean;
	relationFields?: string[];
}

/**
 * Field definitions for each entity type
 */
export const ENTITY_FIELDS = {
	profiles: {
		minimal: ["id", "username", "avatar_url", "full_name"] as const,
		essential: [
			"id",
			"username",
			"avatar_url",
			"full_name",
			"bio",
			"location",
			"created_at",
		] as const,
		complete: [
			"id",
			"username",
			"email",
			"avatar_url",
			"full_name",
			"bio",
			"location",
			"website",
			"phone",
			"created_at",
			"updated_at",
			"is_active",
			"preferences",
		] as const,
	},
	services: {
		minimal: ["id", "title", "price", "is_active", "profile_id"] as const,
		essential: [
			"id",
			"title",
			"description",
			"price",
			"currency",
			"is_active",
			"profile_id",
			"category_id",
			"created_at",
		] as const,
		complete: [
			"id",
			"title",
			"description",
			"price",
			"currency",
			"is_active",
			"profile_id",
			"category_id",
			"location_id",
			"images",
			"tags",
			"availability",
			"created_at",
			"updated_at",
		] as const,
	},
	businesses: {
		minimal: ["id", "name", "type", "is_active", "profile_id"] as const,
		essential: [
			"id",
			"name",
			"type",
			"description",
			"is_active",
			"profile_id",
			"location_id",
			"created_at",
		] as const,
		complete: [
			"id",
			"name",
			"type",
			"description",
			"address",
			"phone",
			"email",
			"website",
			"is_active",
			"profile_id",
			"location_id",
			"images",
			"hours",
			"created_at",
			"updated_at",
		] as const,
	},
	marketplace: {
		minimal: ["id", "title", "price", "is_active", "profile_id"] as const,
		essential: [
			"id",
			"title",
			"description",
			"price",
			"currency",
			"condition",
			"is_active",
			"profile_id",
			"category_id",
			"created_at",
		] as const,
		complete: [
			"id",
			"title",
			"description",
			"price",
			"currency",
			"condition",
			"is_active",
			"profile_id",
			"category_id",
			"location_id",
			"images",
			"tags",
			"created_at",
			"updated_at",
		] as const,
	},
	locations: {
		minimal: ["id", "name", "type", "is_active"] as const,
		essential: [
			"id",
			"name",
			"type",
			"description",
			"is_active",
			"coordinates",
			"created_at",
		] as const,
		complete: [
			"id",
			"name",
			"type",
			"description",
			"address",
			"coordinates",
			"images",
			"is_active",
			"created_at",
			"updated_at",
		] as const,
	},
	messages: {
		minimal: [
			"id",
			"content",
			"created_at",
			"sender_id",
			"receiver_id",
		] as const,
		essential: [
			"id",
			"content",
			"created_at",
			"sender_id",
			"receiver_id",
			"is_read",
			"conversation_id",
		] as const,
		complete: [
			"id",
			"content",
			"created_at",
			"updated_at",
			"sender_id",
			"receiver_id",
			"is_read",
			"conversation_id",
			"attachments",
			"metadata",
		] as const,
	},
} as const;

/**
 * Get selected fields for an entity based on configuration
 */
export function getSelectedFields(
	entity: keyof typeof ENTITY_FIELDS,
	config: FieldSelectionConfig,
): string[] {
	const entityFields = ENTITY_FIELDS[entity];

	let selectedFields: string[] = [];

	switch (config.preset) {
		case "MINIMAL":
			selectedFields = Array.from(entityFields.minimal);
			break;
		case "ESSENTIAL":
			selectedFields = Array.from(entityFields.essential);
			break;
		case "COMPLETE":
			selectedFields = Array.from(entityFields.complete);
			break;
		case "CUSTOM":
			selectedFields =
				config.customFields || Array.from(entityFields.essential);
			break;
	}

	// Apply exclusions
	if (config.excludeFields && config.excludeFields.length > 0) {
		selectedFields = selectedFields.filter(
			(field) => !config.excludeFields?.includes(field),
		);
	}

	return selectedFields;
}

/**
 * Apply field selection to a Supabase query
 */
export function applyFieldSelection<T>(
	query: T,
	fields: string[],
	relations?: Record<string, string[]>,
): T {
	const supabaseQuery = query as {
		select: (fields: string) => T;
	};

	// Select main fields
	supabaseQuery.select(fields.join(", "));

	// Apply relation selections if provided
	if (relations && Object.keys(relations).length > 0) {
		for (const [relation, relationFields] of Object.entries(relations)) {
			if (relationFields.length > 0) {
				supabaseQuery.select(`${relation}(${relationFields.join(", ")})`);
			}
		}
	}

	return query;
}

/**
 * Create field selection query key for TanStack Query
 */
export function createFieldSelectionQueryKey(
	baseKey: string[],
	entity: string,
	config: FieldSelectionConfig,
): string[] {
	return [
		...baseKey,
		"field-selection",
		entity,
		config.preset,
		JSON.stringify(config.customFields || []),
		JSON.stringify(config.excludeFields || []),
		config.includeRelations ? "with-relations" : "no-relations",
		JSON.stringify(config.relationFields || []),
	];
}

/**
 * Smart field selection based on component context
 */
export function getSmartFieldSelection(
	entity: keyof typeof ENTITY_FIELDS,
	context: "list" | "detail" | "edit" | "card" | "search",
	userPreferences?: {
		preferMinimalData?: boolean;
		customFields?: Record<string, string[]>;
	},
): FieldSelectionConfig {
	const baseConfig: FieldSelectionConfig = {
		preset: "ESSENTIAL",
		includeRelations: false,
	};

	// Adjust based on context
	switch (context) {
		case "list":
			baseConfig.preset = userPreferences?.preferMinimalData
				? "MINIMAL"
				: "ESSENTIAL";
			break;
		case "card":
			baseConfig.preset = "MINIMAL";
			break;
		case "detail":
			baseConfig.preset = "ESSENTIAL";
			baseConfig.includeRelations = true;
			break;
		case "edit":
			baseConfig.preset = "COMPLETE";
			baseConfig.includeRelations = true;
			break;
		case "search":
			baseConfig.preset = "MINIMAL";
			break;
	}

	// Apply user custom fields if available
	if (userPreferences?.customFields?.[entity]) {
		baseConfig.preset = "CUSTOM";
		baseConfig.customFields = userPreferences.customFields[entity];
	}

	return baseConfig;
}

/**
 * Field selection utilities for performance monitoring
 */
export const FieldSelectionMonitor = {
	/**
	 * Track field selection usage for optimization
	 */
	trackUsage: (
		entity: string,
		context: string,
		selectedFields: string[],
		totalFields: number,
	) => {
		const usage = {
			timestamp: new Date().toISOString(),
			entity,
			context,
			selectedFieldsCount: selectedFields.length,
			totalFields,
			efficiency: selectedFields.length / totalFields,
			fields: selectedFields,
		};

		// In development, log for optimization analysis
		if (import.meta.env.DEV) {
			console.debug("Field selection usage:", usage);
		}

		// In production, this could send to analytics
		if (import.meta.env.PROD) {
			// TODO: Send to analytics service
		}
	},

	/**
	 * Get field selection efficiency score
	 */
	getEfficiencyScore: (
		selectedFields: string[],
		totalFields: number,
	): number => {
		if (totalFields === 0) return 1;
		return 1 - selectedFields.length / totalFields;
	},

	/**
	 * Suggest field optimization
	 */
	suggestOptimization: (
		entity: keyof typeof ENTITY_FIELDS,
		currentFields: string[],
		context: string,
	): string[] => {
		const entityFields = ENTITY_FIELDS[entity];
		let suggestedFields: string[] = [];

		switch (context) {
			case "list":
			case "card":
				suggestedFields = Array.from(entityFields.minimal);
				break;
			case "detail":
				suggestedFields = Array.from(entityFields.essential);
				break;
			case "edit":
				suggestedFields = Array.from(entityFields.complete);
				break;
			default:
				suggestedFields = Array.from(entityFields.essential);
		}

		// Only suggest if there's a significant difference
		if (Math.abs(currentFields.length - suggestedFields.length) > 2) {
			return suggestedFields;
		}

		return currentFields;
	},
};

/**
 * Default field selection configurations for common components
 */
export const DEFAULT_FIELD_CONFIGS = {
	// List views
	userList: getSmartFieldSelection("profiles", "list"),
	serviceList: getSmartFieldSelection("services", "list"),
	businessList: getSmartFieldSelection("businesses", "list"),
	marketplaceList: getSmartFieldSelection("marketplace", "list"),

	// Card views
	userCard: getSmartFieldSelection("profiles", "card"),
	serviceCard: getSmartFieldSelection("services", "card"),
	businessCard: getSmartFieldSelection("businesses", "card"),

	// Detail views
	userDetail: getSmartFieldSelection("profiles", "detail"),
	serviceDetail: getSmartFieldSelection("services", "detail"),
	businessDetail: getSmartFieldSelection("businesses", "detail"),

	// Edit forms
	userEdit: getSmartFieldSelection("profiles", "edit"),
	serviceEdit: getSmartFieldSelection("services", "edit"),
	businessEdit: getSmartFieldSelection("businesses", "edit"),

	// Search results
	searchResults: getSmartFieldSelection("profiles", "search"),
} as const;
