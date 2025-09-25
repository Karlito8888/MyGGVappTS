import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
			retry: (failureCount, error: Error & { code?: string }) => {
				if (error?.code === "PGRST116") return false; // Not found error
				if (error?.code === "PGRST301") return false; // Permission denied
				return failureCount < 3;
			},
			refetchOnWindowFocus: false, // Disable refetch on window focus
			refetchOnReconnect: true, // Refetch on reconnect
		},
		mutations: {
			retry: (failureCount, error: Error & { code?: string }) => {
				if (error?.code === "PGRST116") return false; // Not found error
				if (error?.code === "PGRST301") return false; // Permission denied
				return failureCount < 2;
			},
		},
	},
});

interface QueryProviderProps {
	children: ReactNode;
}

function RealtimeSync() {
	useRealtimeSync();
	return null;
}

export function QueryProvider({ children }: QueryProviderProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<RealtimeSync />
			{children}
			{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}

export { queryClient };
