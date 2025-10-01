import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import ggvLogo from "../assets/img/ggv.png";
import { redirectIfAuthenticated } from "../lib/routeGuards";
import { supabase } from "../lib/supabase";
import "./auth.css";

export const Route = createFileRoute("/auth")({
	beforeLoad: async ({ context }) => {
		await redirectIfAuthenticated(context);
	},
	component: AuthPage,
});

function AuthPage() {
	const navigate = useNavigate();

	// Listen for auth state changes to handle post-authentication redirects
	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN" && session) {
				navigate({ to: "/" });
			}
		});

		return () => subscription.unsubscribe();
	}, [navigate]);

	return (
		<div className="auth-container">
			<div className="auth-wrapper">
				<img src={ggvLogo} alt="GGV Logo" className="auth-logo" />
			</div>

			<div className="auth-form-container">
				<div className="auth-form">
					<Auth
						supabaseClient={supabase}
						appearance={{ theme: ThemeSupa }}
						providers={["google", "facebook"]}
						socialLayout="horizontal"
						theme="dark"
						redirectTo={`${window.location.origin}/`}
						onlyThirdPartyProviders={false}
					/>
				</div>
			</div>
		</div>
	);
}
