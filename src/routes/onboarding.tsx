import { useForm } from "@tanstack/react-form";
import type { FieldApi } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import { useAuth } from "../hooks";
import { useOnboarding } from "../hooks/utility/useOnboarding";
import { useProfiles } from "../hooks";
import { requireAuthForOnboarding } from "../lib/routeGuards";
import { supabase } from "../lib/supabase";
import "./onboarding.css";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: async ({ context }) => {
		await requireAuthForOnboarding(context);
	},
	component: OnboardingPage,
});

interface OnboardingData {
	username: string;
	avatar_url?: string;
}

interface LocationData {
	location_id: string;
	block: string;
	lot: string;
}

// Reusable FieldInfo component following TanStack Form official pattern
function FieldInfo({
	field,
}: {
	field: FieldApi<
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any
	>;
}) {
	return (
		<>
			{field.state.meta.isTouched && !field.state.meta.isValid ? (
				<div className="error-message" role="alert">
					{field.state.meta.errors.join(", ")}
				</div>
			) : null}
			{field.state.meta.isValidating ? (
				<span className="validation-spinner">Validating...</span>
			) : null}
		</>
	);
}

function OnboardingPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const {
		updateProfile,
		requestLocationAssociation,
		isUpdatingProfile,
		isRequestingLocation,
		profileError,
		locationError,
		profileSuccess,

		locations,
		locationsLoading,
	} = useOnboarding();

	const { profile } = useProfiles({ mode: "byId", id: user?.id || "" });

	const [currentStep, setCurrentStep] = useState(1);
	const [showSuccess, setShowSuccess] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [isImmediate, setIsImmediate] = useState(false);

	// Profile form using TanStack Form
	const profileForm = useForm({
		defaultValues: (() => {
			// Try to load from localStorage first, then fallback to profile data, then user data
			try {
				const saved = localStorage.getItem(`onboarding-profile-${user?.id}`);
				if (saved) {
					const parsed = JSON.parse(saved);
					return {
						username:
							parsed.username || profile?.username || user?.username || "",
						avatar_url:
							parsed.avatar_url ||
							profile?.avatar_url ||
							user?.avatar_url ||
							"",
					};
				}
			} catch (error) {
				console.warn("Failed to load saved profile data:", error);
			}

			return {
				username: profile?.username || user?.username || "",
				avatar_url: profile?.avatar_url || user?.avatar_url || "",
			};
		})() as OnboardingData,
		onSubmit: async ({ value }) => {
			if (!user?.id) return;
			updateProfile({ userId: user.id, data: value });
		},
	});

	// Auto-save profile form to localStorage
	useEffect(() => {
		if (!user?.id) return;

		const subscription = profileForm.store.subscribe(() => {
			try {
				localStorage.setItem(
					`onboarding-profile-${user.id}`,
					JSON.stringify(profileForm.state.values),
				);
			} catch (error) {
				console.warn("Failed to save profile data:", error);
			}
		});

		return () => subscription();
	}, [user?.id, profileForm]);

	// Location form using TanStack Form
	const locationForm = useForm({
		defaultValues: {
			location_id: "",
			block: "",
			lot: "",
		} as LocationData,
		validators: {
			onChange: ({ value }) => {
				// Cross-field validation: either select existing location OR provide block+lot
				const hasExistingLocation = !!value.location_id;
				const hasNewLocation = !!(value.block?.trim() && value.lot?.trim());

				if (!hasExistingLocation && !hasNewLocation) {
					return {
						form: "Please select an existing location or enter block and lot numbers for a new location",
					};
				}
				return undefined;
			},
		},
		onSubmit: async ({ value }) => {
			if (!user?.id) return;
			requestLocationAssociation(
				{
					userId: user.id,
					locationData: value,
				},
				{
					onSuccess: (result) => {
						if (result.immediate) {
							setIsImmediate(true);
							setIsOwner(result.isOwner);
							// If immediate owner, redirect to home after a short delay
							setTimeout(() => {
								navigate({ to: "/" });
							}, 2000);
						} else {
							setShowSuccess(true);
						}
					},
				},
			);
		},
	});

	// Handle profile update success - move to step 2
	useEffect(() => {
		if (profileSuccess && currentStep === 1) {
			setCurrentStep(2);
			// Clear saved profile data since it's now saved to the server
			try {
				localStorage.removeItem(`onboarding-profile-${user?.id}`);
			} catch (error) {
				console.warn("Failed to clear saved profile data:", error);
			}
		}
	}, [profileSuccess, currentStep, user?.id]);

	// Handle errors with TanStack Form
	useEffect(() => {
		if (profileError) {
			const errorMessage = profileError.message;
			if (errorMessage.includes("Username is already taken")) {
				profileForm.setFieldMeta("username", (prev) => ({
					...prev,
					errors: ["This username is already taken"],
				}));
			} else {
				profileForm.setErrorMap({
					onSubmit: "Failed to update profile. Please try again." as any,
				});
			}
		}
	}, [profileError, profileForm]);

	useEffect(() => {
		if (locationError) {
			locationForm.setErrorMap({
				onSubmit:
					"Failed to request location association. Please try again." as any,
			});
		}
	}, [locationError, locationForm]);

	const handleBackToApp = () => {
		navigate({ to: "/" });
	};

	if (showSuccess || isImmediate) {
		return (
			<div className="onboarding-container">
				<div className="onboarding-content">
					<div className="onboarding-header">
						<h1>🎉 Welcome to GGV App!</h1>
						<p>Your profile has been created successfully</p>
					</div>

					<div className="success-message">
						{isImmediate && isOwner ? (
							<>
								<h3>🏠 Congratulations! You're now a location owner!</h3>
								<p>
									Since you're the first person to claim this location, you've
									been automatically verified as the owner. Your onboarding is
									now complete!
								</p>
								<p>
									You now have full access to all community features and can
									approve future association requests for your location.
								</p>
								<p className="redirect-notice">
									Redirecting you to the community in a moment...
								</p>
							</>
						) : (
							<>
								<h3>What happens next?</h3>
								<p>
									Your location association request has been submitted and is
									pending approval. Once approved by the location owner or a
									community admin, your onboarding will be complete and you'll
									have full access to all community features.
								</p>
								<p>
									In the meantime, you can explore the community and start
									connecting with your neighbors!
								</p>
							</>
						)}
					</div>

					{!isImmediate && (
						<button
							type="button"
							onClick={handleBackToApp}
							className="onboarding-submit-btn"
						>
							Explore Community
						</button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="onboarding-container">
			<div className="onboarding-content">
				<div className="onboarding-header">
					<h1>Welcome to GGV Community!</h1>
					<p>
						Step {currentStep} of 2:{" "}
						{currentStep === 1 ? "Set up your profile" : "Choose your location"}
					</p>

					{/* Progress bar */}
					<div className="progress-bar">
						<div className="progress-step active">
							<div className="step-number">1</div>
							<div className="step-label">Profile</div>
						</div>
						<div className="progress-line">
							<div
								className={`progress-fill ${currentStep >= 2 ? "active" : ""}`}
							/>
						</div>
						<div
							className={`progress-step ${currentStep >= 2 ? "active" : ""}`}
						>
							<div className="step-number">2</div>
							<div className="step-label">Location</div>
						</div>
					</div>
				</div>

				{currentStep === 1 && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							profileForm.handleSubmit();
						}}
						className="onboarding-form"
					>
						<div className="form-group">
							<h3>Profile Picture</h3>
							<div className="avatar-preview">
								<Avatar
									avatar_url={profile?.avatar_url || user?.avatar_url}
									username={
										profile?.username ||
										user?.username ||
										profileForm.getFieldValue("username")
									}
									size="lg"
								/>
							</div>
						</div>

						<profileForm.Field
							name="username"
							validators={{
								onChange: ({ value }) => {
									if (!value?.trim()) return "A username is required";
									if (value.length < 3)
										return "Username must be at least 3 characters";
									return undefined;
								},
								onChangeAsyncDebounceMs: 500,
								onChangeAsync: async ({ value }) => {
									if (!value?.trim() || value.length < 3) return undefined;

									try {
										await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay

										// Check if username is available
										const { data: existingUser, error } = await supabase
											.from("profiles")
											.select("id")
											.eq("username", value)
											.neq("id", user?.id || "")
											.single();

										// If error is "not found", username is available
										if (error?.code === "PGRST116") {
											return undefined;
										}

										if (error) {
											return "Unable to check username availability";
										}

										return existingUser
											? "This username is already taken"
											: undefined;
									} catch (error) {
										console.warn("Username validation error:", error);
										return "Unable to check username availability";
									}
								},
							}}
						>
							{(field) => (
								<div className="form-group">
									<label htmlFor={field.name}>Username *</label>
									<div className="input-with-validation">
										<input
											type="text"
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Choose a unique username"
											className={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
													? "error"
													: ""
											}
										/>
									</div>
									<FieldInfo field={field} />
								</div>
							)}
						</profileForm.Field>

						{profileForm.state.errorMap.onSubmit && (
							<div className="error-message">
								{profileForm.state.errorMap.onSubmit}
							</div>
						)}

						<profileForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<button
									type="submit"
									className="onboarding-submit-btn"
									disabled={!canSubmit || isUpdatingProfile}
								>
									{isUpdatingProfile || isSubmitting
										? "..."
										: "Continue to Location"}
								</button>
							)}
						</profileForm.Subscribe>
					</form>
				)}

				{currentStep === 2 && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							locationForm.handleSubmit();
						}}
						className="onboarding-form"
					>
						<div className="location-info">
							<p>
								Choose your location to complete your community registration:
							</p>
						</div>

						{/* Profile summary */}
						<div className="profile-summary">
							<h4>Your Profile Summary:</h4>

							<div className="summary-item">
								<strong>Username:</strong>{" "}
								{profileForm.getFieldValue("username")}
							</div>
						</div>

						<locationForm.Field name="location_id">
							{(field) => (
								<div className="form-group">
									<label htmlFor={field.name}>Join an Existing Location</label>
									<select
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => {
											field.handleChange(e.target.value);
											// Clear block and lot when selecting existing location
											if (e.target.value) {
												locationForm.setFieldValue("block", "");
												locationForm.setFieldValue("lot", "");
											}
										}}
										disabled={locationsLoading}
									>
										<option value="">
											Select a location with existing residents...
										</option>
										{locations?.map((location) => (
											<option key={location.id} value={location.id}>
												Block {location.block}, Lot {location.lot}
											</option>
										))}
									</select>
									<small className="form-help">
										Requires approval from the location owner
									</small>
								</div>
							)}
						</locationForm.Field>

						<div className="form-divider">
							<span>OR</span>
						</div>

						<div className="form-row">
							<locationForm.Field
								name="block"
								validators={{
									onChange: ({ value, fieldApi }) => {
										const locationId =
											fieldApi.form.getFieldValue("location_id");
										const lot = fieldApi.form.getFieldValue("lot");

										// Only validate if no existing location is selected
										if (!locationId && !value?.trim() && !lot?.trim()) {
											return "Block number is required when creating new location";
										}
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="form-group">
										<label htmlFor={field.name}>
											Claim New Location - Block Number
										</label>
										<input
											type="text"
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => {
												field.handleChange(e.target.value);
												// Clear location_id when entering block/lot
												if (e.target.value) {
													locationForm.setFieldValue("location_id", "");
												}
											}}
											placeholder="e.g., 1"
											disabled={!!locationForm.getFieldValue("location_id")}
											className={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
													? "error"
													: ""
											}
										/>
										<FieldInfo field={field} />
									</div>
								)}
							</locationForm.Field>

							<locationForm.Field
								name="lot"
								validators={{
									onChange: ({ value, fieldApi }) => {
										const locationId =
											fieldApi.form.getFieldValue("location_id");
										const block = fieldApi.form.getFieldValue("block");

										// Only validate if no existing location is selected
										if (!locationId && !value?.trim() && !block?.trim()) {
											return "Lot number is required when creating new location";
										}
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="form-group">
										<label htmlFor={field.name}>Lot Number</label>
										<input
											type="text"
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => {
												field.handleChange(e.target.value);
												// Clear location_id when entering block/lot
												if (e.target.value) {
													locationForm.setFieldValue("location_id", "");
												}
											}}
											placeholder="e.g., 15"
											disabled={!!locationForm.getFieldValue("location_id")}
											className={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
													? "error"
													: ""
											}
										/>
										<FieldInfo field={field} />
									</div>
								)}
							</locationForm.Field>
						</div>
						<small className="form-help">
							If this location doesn't exist yet, you'll become the owner
							automatically
						</small>

						{locationForm.state.errorMap.onChange && (
							<div className="form-error-message" role="alert">
								{typeof locationForm.state.errorMap.onChange === "string"
									? locationForm.state.errorMap.onChange
									: (locationForm.state.errorMap.onChange as any)?.form ||
										"Validation error"}
							</div>
						)}
						{locationForm.state.errorMap.onSubmit && (
							<div className="form-error-message" role="alert">
								{locationForm.state.errorMap.onSubmit}
							</div>
						)}

						<locationForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<div className="form-actions">
									<button
										type="button"
										onClick={() => setCurrentStep(1)}
										className="onboarding-back-btn"
										disabled={isRequestingLocation || isSubmitting}
									>
										Back
									</button>
									<button
										type="submit"
										className="onboarding-submit-btn"
										disabled={!canSubmit || isRequestingLocation}
									>
										{isRequestingLocation || isSubmitting
											? "..."
											: "Request Location Access"}
									</button>
								</div>
							)}
						</locationForm.Subscribe>
					</form>
				)}
			</div>
		</div>
	);
}
