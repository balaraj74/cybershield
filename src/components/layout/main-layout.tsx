"use client";

import { Sidebar } from "./sidebar";
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
        <div className="min-h-screen bg-slate-950">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />

            {/* Gradient Orbs */}
            <div className="fixed -left-40 -top-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="fixed -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

            <Sidebar userRole={user?.user_metadata?.role || "user"} />

            <div className={cn("relative lg:ml-64 transition-all duration-300")}>
                <Header
                    user={{
                        name: user?.user_metadata?.full_name || user?.email?.split("@")[0],
                        email: user?.email || undefined,
                        role: user?.user_metadata?.role || "user",
                    }}
                />

                <main className="min-h-[calc(100vh-4rem)] p-6">
                    {children}
                </main>
            </div>

            {/* Demo Mode Indicator */}
            <DemoModeIndicator />
        </div>
    );
}
