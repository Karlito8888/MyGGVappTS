import { createContext, useContext } from "react";
import { useAuth } from "../hooks/entities/useAuth";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signInWithGoogle: () => void;
	signInWithFacebook: () => void;
	signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	// Use the new unified auth hook
	const { authUser, loading, signInWithGoogle, signInWithFacebook, signOut } =
		useAuth();

	const value = {
		user: authUser,
		loading,
		signInWithGoogle,
		signInWithFacebook,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
}
