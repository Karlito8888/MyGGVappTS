import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import "./auth.css";

export const Route = createFileRoute("/auth")({
	component: AuthPage,
});

function AuthPage() {
	return (
		<div className="auth-container">
			<div className="auth-wrapper">
				<h2 className="auth-title">Sign in to your account</h2>
			</div>

			<div className="auth-form-container">
				<div className="auth-form">
					<Auth
						supabaseClient={supabase}
						appearance={{
							theme: ThemeSupa,
							style: {
								button: {
									background: "#1f2937",
									color: "white",
									borderRadius: "8px",
								},
								input: {
									background: "#374151",
									color: "white",
									borderRadius: "8px",
									border: "1px solid #4b5563",
								},
							},
						}}
						providers={["google", "facebook"]}
						socialLayout="horizontal"
						theme="dark"
					/>
				</div>
			</div>
		</div>
	);
}
