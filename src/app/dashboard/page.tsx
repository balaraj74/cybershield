"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Shield,
    AlertTriangle,
    Activity,
    Clock,
    ArrowRight,
    Mail,
    Link as LinkIcon,
    MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { StatCard, ThreatTrendChart, ThreatCategoryChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { ThreatStats } from "@/types";

async function fetchDashboardStats(): Promise<ThreatStats> {
    const res = await fetch("/api/proxy/stats");
    if (!res.ok) throw new Error("Failed to fetch stats");
    const data = await res.json();
    return data.data;
}

export default function DashboardPage() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: fetchDashboardStats,
        refetchInterval: 60000, // Refresh every minute
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error || !stats) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Card variant="elevated" className="max-w-md text-center">
                    <CardContent className="py-12">
                        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                        <h3 className="mt-4 text-lg font-semibold">Unable to Load Dashboard</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            There was a problem fetching the dashboard data. Please try again.
                        </p>
                        <Button className="mt-6" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const inputTypeIcons = {
        email: Mail,
        url: LinkIcon,
        message: MessageSquare,
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
                    <p className="mt-1 text-slate-400">
                        Real-time threat monitoring and analysis overview
                    </p>
                </div>
                <Button asChild>
                    <Link href="/analyze">
                        <Shield className="mr-2 h-4 w-4" />
                        New Analysis
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Threats Detected"
                    value={stats.totalThreats.toLocaleString()}
                    subtitle="All time"
                    icon={Shield}
                    variant="info"
                    trend={{ value: 12, isPositive: false }}
                />
                <StatCard
                    title="High Risk Alerts"
                    value={stats.highRiskCount.toLocaleString()}
                    subtitle="Requires attention"
                    icon={AlertTriangle}
                    variant="critical"
                />
                <StatCard
                    title="Active Monitoring"
                    value="24/7"
                    subtitle="AI-powered protection"
                    icon={Activity}
                    variant="success"
                />
                <StatCard
                    title="Last Analysis"
                    value={
                        stats.recentAlerts?.[0]?.analyzedAt
                            ? formatRelativeTime(stats.recentAlerts[0].analyzedAt)
                            : "—"
                    }
                    subtitle="Most recent scan"
                    icon={Clock}
                    variant="default"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ThreatTrendChart data={stats.threatsOverTime} />
                <ThreatCategoryChart data={stats.threatsByType} />
            </div>

            {/* Recent Alerts */}
            <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Recent Alerts</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/history">
                            View All
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats.recentAlerts.length === 0 ? (
                            <div className="py-8 text-center text-slate-500">
                                No recent alerts
                            </div>
                        ) : (
                            stats.recentAlerts.map((alert) => {
                                const Icon = inputTypeIcons[alert.inputType];
                                return (
                                    <div
                                        key={alert.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                                                <Icon className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium capitalize text-white">
                                                        {alert.threatType.replace("_", " ")}
                                                    </span>
                                                    <SeverityBadge severity={alert.severity} />
                                                </div>
                                                <p className="mt-0.5 text-sm text-slate-500">
                                                    {alert.inputType.charAt(0).toUpperCase() +
                                                        alert.inputType.slice(1)}{" "}
                                                    analysis • {formatRelativeTime(alert.analyzedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-white">
                                                {alert.riskScore}%
                                            </div>
                                            <div className="text-xs text-slate-500">Risk Score</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Link href="/analyze?type=email" className="group">
                    <Card
                        variant="elevated"
                        className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
                    >
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                                <Mail className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white group-hover:text-cyan-400">
                                    Analyze Email
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Check for phishing attempts
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/analyze?type=url" className="group">
                    <Card
                        variant="elevated"
                        className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
                    >
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                                <LinkIcon className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white group-hover:text-orange-400">
                                    Scan URL
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Detect malicious links
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/analyze?type=message" className="group">
                    <Card
                        variant="elevated"
                        className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
                    >
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                                <MessageSquare className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white group-hover:text-purple-400">
                                    Check Message
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Analyze suspicious text
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
