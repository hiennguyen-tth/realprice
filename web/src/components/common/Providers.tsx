"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { ChatBot } from "@/components/chat/ChatBot";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

// Syncs NextAuth session token → localStorage so api.ts interceptor can use it
function TokenSync() {
  const { data: session } = useSession();
  useEffect(() => {
    const token = (session as { accessToken?: string } | null)?.accessToken;
    if (token) {
      localStorage.setItem("realprice_token", token);
    } else if (!session) {
      localStorage.removeItem("realprice_token");
    }
  }, [session]);
  return null;
}

export function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider session={session}>
      <TokenSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <ChatBot />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
