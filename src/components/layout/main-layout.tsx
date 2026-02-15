"use client";

import { FloatingDock } from "./floating-dock";
import { Header } from "./header";
import { DemoModeIndicator } from "@/components/ui/mode-indicator";
import { useAuth } from "@/lib/supabase/auth-provider";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Subtle ambient glow — top center warm gradient */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,93,4,0.06),transparent_70%)]" />

            {/* Floating Dock Navigator */}
            <FloatingDock />

            <div className="relative ml-16">
                <Header
                    user={{
                        name: user?.user_metadata?.full_name || user?.email?.split("@")[0],
                        email: user?.email || undefined,
                        role: user?.user_metadata?.role || "user",
                    }}
                />

                <main className="min-h-[calc(100vh-3.5rem)] p-6">
                    {children}
                </main>
            </div>

            {/* Demo Mode Indicator */}
            <DemoModeIndicator />
        </div>
    );
}
