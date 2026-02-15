"use client";

import { useEffect, useState } from "react";
import {
    Brain, Bug, Network, Zap, EyeOff, Gauge, Fish, UserX,
    ClipboardCheck, Shield, ChevronRight, Activity,
    CheckCircle, AlertCircle, XCircle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

interface ModuleInfo {
    id: number;
    name: string;
    status: string;
    icon: string;
    description: string;
    stats: Record<string, any>;
}

const iconMap: Record<string, React.ElementType> = {
    brain: Brain, bug: Bug, network: Network, zap: Zap,
    "eye-off": EyeOff, gauge: Gauge, fish: Fish, "user-x": UserX,
    "clipboard-check": ClipboardCheck,
};

const linkMap: Record<number, string> = {
    1: "/endpoints",
    2: "/modules/behavior-malware",
    3: "/modules/network-ids",
    4: "/modules/autonomous-response",
    5: "/modules/privacy-ai",
    6: "/modules/risk-score",
    7: "/modules/phishing",
    8: "/modules/insider-threat",
    9: "/modules/compliance",
};

const iconColors: Record<number, string> = {
    1: "text-orange-400",
    2: "text-red-400",
    3: "text-amber-400",
    4: "text-yellow-400",
    5: "text-emerald-400",
    6: "text-rose-400",
    7: "text-orange-300",
    8: "text-red-300",
    9: "text-amber-300",
};

const glowColors: Record<number, string> = {
    1: "shadow-orange-500/5",
    2: "shadow-red-500/5",
    3: "shadow-amber-500/5",
    4: "shadow-yellow-500/5",
    5: "shadow-emerald-500/5",
    6: "shadow-rose-500/5",
    7: "shadow-orange-500/5",
    8: "shadow-red-500/5",
    9: "shadow-amber-500/5",
};

export default function ModulesOverviewPage() {
    const [modules, setModules] = useState<ModuleInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCount, setActiveCount] = useState(0);

    useEffect(() => {
        fetchModules();
        const interval = setInterval(fetchModules, 10000);
        return () => clearInterval(interval);
    }, []);

    async function fetchModules() {
        try {
            const res = await fetch(`${FASTAPI_URL}/api/v1/modules/overview`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setModules(data.modules || []);
            setActiveCount(data.active || 0);
        } catch {
            setModules([]);
        } finally {
            setLoading(false);
        }
    }

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === "active") return <CheckCircle className="h-4 w-4 text-emerald-400" />;
        if (status === "error") return <XCircle className="h-4 w-4 text-red-400" />;
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Security Modules</h1>
                    <p className="mt-1 text-neutral-500">
                        9 specialized AI engines working together to protect your infrastructure
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card variant="glass">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{activeCount}</p>
                            <p className="text-xs text-neutral-500">Active Modules</p>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                            <Shield className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">Real-time</p>
                            <p className="text-xs text-neutral-500">Protection Level</p>
                        </div>
                    </CardContent>
                </Card>
                <Card variant="glass">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                            <Activity className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">24/7</p>
                            <p className="text-xs text-neutral-500">Monitoring</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Module Grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6 animate-pulse">
                                <div className="h-10 w-10 rounded-lg bg-neutral-800 mb-4" />
                                <div className="h-4 w-40 bg-neutral-800 rounded mb-2" />
                                <div className="h-3 w-full bg-neutral-800/50 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {modules.map((mod) => {
                        const Icon = iconMap[mod.icon] || Brain;
                        const link = linkMap[mod.id] || "/modules";

                        return (
                            <Link key={mod.id} href={link}>
                                <Card variant="elevated" className={`group h-full cursor-pointer hover:shadow-xl ${glowColors[mod.id] || ""} transition-all duration-300 hover:scale-[1.02]`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-800/80 border border-neutral-700/30">
                                                <Icon className={`h-5 w-5 ${iconColors[mod.id] || "text-orange-400"}`} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon status={mod.status} />
                                                <span className={`text-[10px] font-bold uppercase ${mod.status === "active" ? "text-emerald-400" : "text-red-400"}`}>
                                                    {mod.status}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-white font-semibold mb-1 group-hover:text-orange-300 transition-colors">
                                            {mod.name}
                                        </h3>
                                        <p className="text-neutral-500 text-xs mb-4 line-clamp-2">
                                            {mod.description}
                                        </p>

                                        {/* Module-specific stats */}
                                        {mod.stats && Object.keys(mod.stats).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {Object.entries(mod.stats)
                                                    .filter(([, val]) => val !== null && typeof val !== "object")
                                                    .slice(0, 3)
                                                    .map(([key, val]) => (
                                                        <span key={key} className="inline-flex items-center rounded-md bg-neutral-800/60 px-2 py-0.5 text-[10px] text-neutral-400">
                                                            {key.replace(/_/g, " ")}: <span className="ml-1 font-semibold text-white">{String(val)}</span>
                                                        </span>
                                                    ))}
                                            </div>
                                        )}

                                        <div className="flex items-center text-orange-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Module <ChevronRight className="h-3 w-3 ml-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
