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
        <div className="min-h-screen bg-neutral-950 font-sans text-neutral-200">
            {/* Ambient grid/dots overlay */}
            <div className="fixed inset-0 bg-dots opacity-[0.4] pointer-events-none" />

            {/* Subtle ambient glow — top center warm gradient */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,93,4,0.12),transparent_70%)] pointer-events-none" />

            {/* Corner ambient glows */}
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed top-1/2 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />


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

                <main className="min-h-[calc(100vh-3.5rem)] p-6 relative animate-fade-in-up">
                    {children}
                </main>
            </div>

            {/* Demo Mode Indicator */}
            <DemoModeIndicator />
        </div>
    );
}
