"use client";

import { useState, useEffect } from "react";
import { Beaker, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoModeIndicatorProps {
    className?: string;
}

export function DemoModeIndicator({ className }: DemoModeIndicatorProps) {
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if demo mode from environment or localStorage
        const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
        setIsDemoMode(demoMode);

        // Check if user dismissed the banner before
        const wasDismissed = localStorage.getItem("demo-banner-dismissed");
        if (wasDismissed) setDismissed(true);
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem("demo-banner-dismissed", "true");
    };

    if (!isDemoMode || dismissed) return null;

    return (
        <div
            className={cn(
                "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 backdrop-blur-sm shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4",
                className
            )}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                <Beaker className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-400">Demo Mode</span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                        Active
                    </span>
                </div>
                <p className="text-xs text-slate-400">
                    Using simulated AI responses for demonstration
                </p>
            </div>
            <button
                onClick={handleDismiss}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

interface LiveModeIndicatorProps {
    className?: string;
}

export function LiveModeIndicator({ className }: LiveModeIndicatorProps) {
    const [isLive, setIsLive] = useState(false);
    const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking");

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch("/api/health");
                if (response.ok) {
                    setBackendStatus("connected");
                    setIsLive(true);
                } else {
                    setBackendStatus("disconnected");
                }
            } catch {
                setBackendStatus("disconnected");
            }
        };

        // Check if NOT in demo mode
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
            checkBackend();
            // Recheck every 30 seconds
            const interval = setInterval(checkBackend, 30000);
            return () => clearInterval(interval);
        }
    }, []);

    if (!isLive) return null;

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5",
                className
            )}
        >
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">Live</span>
            {backendStatus === "connected" && (
                <Zap className="h-3 w-3 text-emerald-400" />
            )}
        </div>
    );
}

export function ModeIndicator() {
    const [mode, setMode] = useState<"demo" | "live" | "unknown">("unknown");

    useEffect(() => {
        setMode(process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "demo" : "live");
    }, []);

    if (mode === "unknown") return null;

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5",
                mode === "demo"
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-emerald-500/30 bg-emerald-500/10"
            )}
        >
            {mode === "demo" ? (
                <>
                    <Beaker className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Demo</span>
                </>
            ) : (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-medium text-emerald-400">Live</span>
                </>
            )}
        </div>
    );
}
