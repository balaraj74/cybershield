"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Filter,
    Mail,
    Link as LinkIcon,
    MessageSquare,
    Clock,
    ChevronLeft,
    ChevronRight,
    Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SeverityBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { HistoryEntry, SeverityLevel, AnalysisInputType } from "@/types";

interface HistoryResponse {
    items: HistoryEntry[];
    total: number;
}

async function fetchHistory(
    page: number,
    limit: number,
    severity: string
): Promise<HistoryResponse> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(severity !== "all" && { severity }),
    });

    const res = await fetch(`/api/proxy/history?${params}`);
    if (!res.ok) throw new Error("Failed to fetch history");
    const data = await res.json();
    return data.data;
}

export default function HistoryPage() {
    const [page, setPage] = useState(1);
    const [severity, setSeverity] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const limit = 10;

    const { data, isLoading, error } = useQuery({
        queryKey: ["history", page, limit, severity],
        queryFn: () => fetchHistory(page, limit, severity),
    });

    const inputTypeIcons: Record<AnalysisInputType, React.ElementType> = {
        email: Mail,
        url: LinkIcon,
        message: MessageSquare,
    };

    const threatTypeLabels: Record<string, string> = {
        phishing: "Phishing",
        malware: "Malware",
        spam: "Spam",
        social_engineering: "Social Engineering",
        credential_theft: "Credential Theft",
        url_threat: "URL Threat",
        data_exfiltration: "Data Exfiltration",
        unknown: "Unknown",
    };

    const totalPages = data ? Math.ceil(data.total / limit) : 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analysis History</h1>
                    <p className="mt-1 text-slate-400">
                        View past threat analyses and their results
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Filters */}
            <Card variant="elevated">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <Input
                                placeholder="Search by ID or threat type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <Select value={severity} onValueChange={setSeverity}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="safe">Safe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Notice */}
            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                <div>
                    <p className="text-sm text-slate-300">
                        <span className="font-medium">Privacy-Preserved Records: </span>
                        Only anonymized metadata is stored. Original content is never retained.
                        Records show hash-based references only.
                    </p>
                </div>
            </div>

            {/* History Table */}
            {isLoading ? (
                <TableSkeleton rows={5} />
            ) : error ? (
                <Card variant="elevated">
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-400">Failed to load history. Please try again.</p>
                        <Button className="mt-4" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="text-base">
                            {data?.total || 0} Analysis Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!data || data.items.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-slate-400">No analysis records found</p>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                <div className="hidden rounded-t-lg bg-slate-800/50 px-4 py-3 md:grid md:grid-cols-6 md:gap-4">
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Type
                                    </span>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Threat
                                    </span>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Severity
                                    </span>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Risk Score
                                    </span>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Analyzed
                                    </span>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                        Ref ID
                                    </span>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-800">
                                    {data.items.map((entry) => {
                                        const Icon = inputTypeIcons[entry.inputType];
                                        return (
                                            <div
                                                key={entry.id}
                                                className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-slate-800/30 md:grid-cols-6 md:items-center md:gap-4"
                                            >
                                                {/* Type */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                                                        <Icon className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <span className="capitalize text-white md:hidden">
                                                        {entry.inputType}
                                                    </span>
                                                </div>

                                                {/* Threat */}
                                                <div>
                                                    <span className="text-sm text-white">
                                                        {threatTypeLabels[entry.threatType] || entry.threatType}
                                                    </span>
                                                </div>

                                                {/* Severity */}
                                                <div>
                                                    <SeverityBadge severity={entry.severity as SeverityLevel} />
                                                </div>

                                                {/* Risk Score */}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-700">
                                                            <div
                                                                className={`h-full transition-all ${entry.riskScore >= 80
                                                                        ? "bg-red-500"
                                                                        : entry.riskScore >= 60
                                                                            ? "bg-orange-500"
                                                                            : entry.riskScore >= 40
                                                                                ? "bg-yellow-500"
                                                                                : entry.riskScore >= 20
                                                                                    ? "bg-blue-500"
                                                                                    : "bg-emerald-500"
                                                                    }`}
                                                                style={{ width: `${entry.riskScore}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium text-white">
                                                            {entry.riskScore}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Analyzed */}
                                                <div>
                                                    <p className="text-sm text-slate-400">
                                                        {formatRelativeTime(entry.analyzedAt)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatDate(entry.analyzedAt)}
                                                    </p>
                                                </div>

                                                {/* Ref ID */}
                                                <div>
                                                    <code className="text-xs text-slate-500">
                                                        {entry.inputHash}
                                                    </code>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                                        <p className="text-sm text-slate-500">
                                            Page {page} of {totalPages}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
