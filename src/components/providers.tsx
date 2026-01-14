"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider } from "@/lib/supabase/auth-provider";
import { useState } from "react";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <SupabaseAuthProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </QueryClientProvider>
        </SupabaseAuthProvider>
    );
}
