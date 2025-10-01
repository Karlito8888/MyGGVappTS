/**
 * Error Handling Utilities
 *
 * Provides centralized error handling for RLS errors, common database errors,
 * and retry logic with graceful degradation.
 */

import type {
	UseQueryOptions,
	UseMutationOptions,
} from "@tanstack/react-query";

/**
 * Error types for better error handling
 */
export interface AppError {
	code?: string;
	message: string;
	details?: any;
	entity?: string;
	operation?: string;
	timestamp: number;
}

/**
 * Error configuration interface
 */
export interface ErrorConfig {
	retry: boolean | number;
	retryDelay?: number;
	onError?: (error: AppError) => void;
	fallback?: any;
	suppressNotification?: boolean;
}

/**
 * Error handler class with centralized error management
 */
export const ErrorHandler = {
	/**
	 * Handle query errors with proper categorization
	 */
	handleQueryError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			message: error?.message || "Unknown error occurred",
			timestamp: Date.now(),
			entity: entityName,
			operation,
		};

		if (error?.code) {
			appError.code = error.code;
		}

		switch (error?.code) {
			case "42501":
				return ErrorHandler.handleRLSError(error, entityName, operation);
			case "PGRST116":
				return ErrorHandler.handleNotFoundError(error, entityName, operation);
			case "23505":
				return ErrorHandler.handleUniqueConstraintError(
					error,
					entityName,
					operation,
				);
			case "23503":
				return ErrorHandler.handleForeignKeyError(error, entityName, operation);
			case "23514":
				return ErrorHandler.handleCheckConstraintError(
					error,
					entityName,
					operation,
				);
			case "28P01":
				return ErrorHandler.handleAuthError(error, entityName, operation);
			case "08006":
			case "08001":
				return ErrorHandler.handleConnectionError(error, entityName, operation);
			default:
				return ErrorHandler.handleGenericError(error, entityName, operation);
		}
	},

	/**
	 * Handle RLS permission errors
	 */
	handleRLSError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: "42501",
			message: `Access denied for ${entityName}${operation ? ` during ${operation}` : ""}`,
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.warn(`RLS Error [${entityName}]:`, appError);
		return appError;
	},

	handleNotFoundError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: "PGRST116",
			message: `${entityName} not found${operation ? ` during ${operation}` : ""}`,
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.log(`Not Found [${entityName}]:`, appError);
		return appError;
	},

	handleUniqueConstraintError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: "23505",
			message: `Duplicate entry detected for ${entityName}`,
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.error(`Unique Constraint Error [${entityName}]:`, appError);
		return appError;
	},

	handleForeignKeyError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: "23503",
			message: `Referenced entity not found for ${entityName}`,
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.error(`Foreign Key Error [${entityName}]:`, appError);
		return appError;
	},

	handleCheckConstraintError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: "23514",
			message: `Data validation failed for ${entityName}`,
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.error(`Check Constraint Error [${entityName}]:`, appError);
		return appError;
	},

	handleAuthError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: "28P01",
			message: "Authentication failed. Please sign in again.",
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.error(`Auth Error [${entityName}]:`, appError);
		return appError;
	},

	handleConnectionError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			code: error.code || "CONNECTION_ERROR",
			message:
				"Connection to server failed. Please check your internet connection.",
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.error(`Connection Error [${entityName}]:`, appError);
		return appError;
	},

	handleGenericError: (
		error: any,
		entityName: string,
		operation?: string,
	): AppError => {
		const appError: AppError = {
			message:
				error?.message || `An error occurred while accessing ${entityName}`,
			details: error.details,
			entity: entityName,
			operation,
			timestamp: Date.now(),
		};

		console.error(`Generic Error [${entityName}]:`, appError);
		return appError;
	},

	shouldRetry: (
		error: AppError,
		attemptNumber: number,
		maxRetries = 3,
	): boolean => {
		if (
			error.code === "42501" ||
			error.code === "PGRST116" ||
			error.code === "23505" ||
			error.code === "23503" ||
			error.code === "23514"
		) {
			return false;
		}

		if (
			error.code === "08006" ||
			error.code === "08001" ||
			error.code === "28P01"
		) {
			return attemptNumber < maxRetries;
		}

		return attemptNumber < maxRetries;
	},

	calculateRetryDelay: (
		attemptNumber: number,
		baseDelay = 1000,
	): number => Math.min(baseDelay * 2 ** attemptNumber, 30000),

	createQueryOptions: <T>(
		_entityName: string,
		_operation?: string,
		config?: ErrorConfig,
	): Omit<UseQueryOptions<T, AppError>, "queryKey" | "queryFn"> => ({
			retry: (failureCount, error: any) => {
				const shouldRetry = ErrorHandler.shouldRetry(
					error as AppError,
					failureCount,
					typeof config?.retry === "number" ? config.retry : 3,
				);

				if (!shouldRetry && config?.onError) {
					config.onError(error as AppError);
				}

				return shouldRetry;
			},
			retryDelay: (attemptIndex: number) => {
				return (
					config?.retryDelay || ErrorHandler.calculateRetryDelay(attemptIndex)
				);
			},
		}),

	createMutationOptions: <TData, TVariables, TContext>(
		_entityName: string,
		_operation?: string,
		config?: ErrorConfig,
	): Omit<
		UseMutationOptions<TData, AppError, TVariables, TContext>,
		"mutationFn"
	> => ({
			retry: (failureCount, error: any) => {
				const shouldRetry = ErrorHandler.shouldRetry(
					error as AppError,
					failureCount,
					typeof config?.retry === "number" ? config.retry : 3,
				);

				if (!shouldRetry && config?.onError) {
					config.onError(error as AppError);
				}

				return shouldRetry;
			},
			retryDelay: (attemptIndex: number) => {
				return (
					config?.retryDelay || ErrorHandler.calculateRetryDelay(attemptIndex)
				);
			},
		}),

	getUserFriendlyMessage: (error: AppError): string => {
		switch (error.code) {
			case "42501":
				return "You don't have permission to access this resource.";
			case "PGRST116":
				return "The requested item was not found.";
			case "23505":
				return "This item already exists.";
			case "23503":
				return "Referenced item not found.";
			case "23514":
				return "Please check your input and try again.";
			case "28P01":
				return "Please sign in to continue.";
			case "08006":
			case "08001":
				return "Connection failed. Please check your internet connection.";
			default:
				return error.message || "An unexpected error occurred.";
		}
	},

	isCriticalError: (error: AppError): boolean => {
		if (error.code === "42501" || error.code === "PGRST116") {
			return false;
		}

		if (
			error.code === "08006" ||
			error.code === "08001" ||
			error.code === "28P01"
		) {
			return true;
		}

		if (
			error.code === "23505" ||
			error.code === "23503" ||
			error.code === "23514"
		) {
			return true;
		}

		return true;
	},
};

export const ErrorRecovery = {
	async recoverFromRLSError(): Promise<boolean> {
		try {
			console.log("Attempting to recover from RLS error...");
			return true;
		} catch (error) {
			console.error("Failed to recover from RLS error:", error);
			return false;
		}
	},

	async recoverFromConnectionError(): Promise<boolean> {
		try {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			console.log("Attempting to recover from connection error...");
			return true;
		} catch (error) {
			console.error("Failed to recover from connection error:", error);
			return false;
		}
	},

	async recoverFromAuthError(): Promise<boolean> {
		try {
			console.log("Attempting to recover from auth error...");
			return true;
		} catch (error) {
			console.error("Failed to recover from auth error:", error);
			return false;
		}
	},
};

export default ErrorHandler;
