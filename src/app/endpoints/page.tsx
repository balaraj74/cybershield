"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Monitor,
    Shield,
    AlertTriangle,
    Activity,
    Wifi,
    WifiOff,
    Cpu,
    HardDrive,
    Network,
    Skull,
    Zap,
    Eye,
    XCircle,
    CheckCircle,
    Clock,
    TrendingUp,
    Brain,
    Server,
    RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState, useCallback } from "react";

// ============================================
// Types
// ============================================

interface DeviceData {
    id: string;
    deviceName: string;
    osVersion: string;
    status: "online" | "offline" | "at_risk" | "compromised";
    lastSeen: string;
    riskScore: number;
    riskLevel: string;
    cpuPercent: number;
    memoryPercent: number;
    activeProcesses: number;
    activeConnections: number;
    totalThreats: number;
}

interface ThreatData {
    id: string;
    deviceId: string;
    deviceName: string;
    pid: number;
    processName: string;
    anomalyScore: number;
    severity: string;
    reason: string;
    actionTaken: string;
    detectedAt: string;
    isResolved: boolean;
}

interface EndpointStats {
    totalDevices: number;
    onlineDevices: number;
    atRiskDevices: number;
    totalThreatsToday: number;
    totalThreatsAll: number;
    activeThreats: number;
    avgRiskScore: number;
    processesKilled: number;
    modelStatus: string;
    trainingSamples: number;
    devices: DeviceData[];
    recentThreats: ThreatData[];
    threatTrend: Array<{ date: string; threats: number; blocked: number }>;
    activityChart: Array<{ hour: string; processes: number; connections: number; fileEvents: number }>;
}

// ============================================
// Data Fetching
// ============================================

const BACKEND_URL = "http://localhost:8001";

async function fetchEndpointStats(): Promise<EndpointStats> {
    // Try direct backend first, fall back to Next.js proxy
    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/endpoint/dashboard/stats`, {
            headers: {
                "X-API-Key": "cybershield-api-key",
            },
        });
        if (res.ok) {
            const json = await res.json();
            return json.data;
        }
    } catch {
        // Backend not reachable, try proxy
    }

    // Fallback to Next.js proxy
    const res = await fetch("/api/endpoint");
    if (!res.ok) throw new Error("Failed to fetch endpoint stats");
    const json = await res.json();
    return json.data;
}

// ============================================
// Sub-Components
// ============================================

function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
        online: "bg-emerald-400 shadow-emerald-400/50",
        offline: "bg-neutral-500 shadow-neutral-500/30",
        at_risk: "bg-amber-400 shadow-amber-400/50 animate-pulse",
        compromised: "bg-red-500 shadow-red-500/50 animate-pulse",
    };
    return (
        <span
            className={`inline-block h-2.5 w-2.5 rounded-full shadow-lg ${colors[status] || colors.offline}`}
        />
    );
}

function SeverityBadge({ severity }: { severity: string }) {
    const styles: Record<string, string> = {
        critical: "bg-red-500/20 text-red-400 border-red-500/30",
        high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        low: "bg-orange-500/20 text-blue-400 border-orange-500/30",
        safe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[severity] || styles.low}`}
        >
            {severity}
        </span>
    );
}

function RiskGauge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
    const color =
        score >= 80 ? "text-red-400" : score >= 50 ? "text-amber-400" : score >= 25 ? "text-blue-400" : "text-emerald-400";
    const bgColor =
        score >= 80 ? "from-red-500/20" : score >= 50 ? "from-amber-500/20" : score >= 25 ? "from-orange-500/20" : "from-emerald-500/20";
    const dim = size === "sm" ? "h-12 w-12 text-sm" : "h-16 w-16 text-lg";

    return (
        <div className={`relative flex ${dim} items-center justify-center rounded-full bg-gradient-to-br ${bgColor} to-transparent`}>
            <span className={`font-bold ${color}`}>{Math.round(score)}</span>
            <svg className="absolute inset-0" viewBox="0 0 36 36">
                <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${score}, 100`}
                    className={`${color} opacity-40`}
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
    return (
        <div className="flex items-end gap-[2px] h-8">
            {data.map((val, i) => (
                <div
                    key={i}
                    className={`w-1 rounded-t ${color} transition-all duration-300`}
                    style={{ height: `${Math.max(2, (val / maxVal) * 100)}%`, opacity: 0.4 + (i / data.length) * 0.6 }}
                />
            ))}
        </div>
    );
}

function formatTime(iso: string) {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

// ============================================
// Main Dashboard Component
// ============================================

export default function EndpointMonitorPage() {
    const { data: stats, isLoading, error, refetch } = useQuery({
        queryKey: ["endpointStats"],
        queryFn: fetchEndpointStats,
        refetchInterval: 15000,
    });

    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [killingProcess, setKillingProcess] = useState<string | null>(null);

    const handleKillProcess = useCallback(async (threat: ThreatData) => {
        setKillingProcess(threat.id);
        try {
            await fetch("/api/endpoint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "kill_process",
                    deviceId: threat.deviceId,
                    pid: threat.pid,
                    processName: threat.processName,
                    reason: "Manual kill from dashboard",
                }),
            });
            refetch();
        } catch {
            // Error handling
        } finally {
            setKillingProcess(null);
        }
    }, [refetch]);

    if (isLoading) {
        return <EndpointDashboardSkeleton />;
    }

    if (error || !stats) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Card variant="elevated" className="max-w-md text-center">
                    <CardContent className="py-12">
                        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                        <h3 className="mt-4 text-lg font-semibold text-white">Unable to Load Endpoint Data</h3>
                        <p className="mt-2 text-sm text-neutral-400">
                            Cannot connect to the monitoring backend. Please check connectivity.
                        </p>
                        <Button className="mt-6" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const selectedDeviceData = stats.devices.find((d) => d.id === selectedDevice);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
                            <Monitor className="h-5 w-5 text-white" />
                        </div>
                        Endpoint Protection
                    </h1>
                    <p className="mt-1 text-neutral-400">
                        AI-powered behavioral monitoring • Real-time threat detection & auto-response
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-neutral-800/50 px-3 py-2 border border-neutral-700/50">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-neutral-400">AI Model:</span>
                        <span className={`text-xs font-semibold ${stats.modelStatus === "trained" ? "text-emerald-400" : "text-amber-400"}`}>
                            {stats.modelStatus === "trained" ? "Trained" : "Heuristic"}
                        </span>
                        <span className="text-[10px] text-neutral-500">({stats.trainingSamples} samples)</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        className="text-neutral-400 hover:text-white"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
                <KPICard
                    title="Total Devices"
                    value={stats.totalDevices}
                    subtitle={`${stats.onlineDevices} online`}
                    icon={Server}
                    color="cyan"
                />
                <KPICard
                    title="Active Threats"
                    value={stats.activeThreats}
                    subtitle={`${stats.totalThreatsToday} today`}
                    icon={Skull}
                    color="red"
                    pulse={stats.activeThreats > 0}
                />
                <KPICard
                    title="Processes Killed"
                    value={stats.processesKilled}
                    subtitle="Auto-response"
                    icon={Zap}
                    color="amber"
                />
                <KPICard
                    title="Avg Risk Score"
                    value={Math.round(stats.avgRiskScore)}
                    subtitle={stats.avgRiskScore >= 50 ? "Elevated" : "Normal"}
                    icon={Shield}
                    color={stats.avgRiskScore >= 50 ? "amber" : "emerald"}
                />
            </div>

            {/* Devices + Threats Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Devices Panel */}
                <div className="lg:col-span-2">
                    <Card variant="elevated" className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Monitor className="h-4 w-4 text-orange-400" />
                                Endpoints
                                <span className="text-xs font-normal text-neutral-500">
                                    ({stats.onlineDevices}/{stats.totalDevices} online)
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            {stats.devices.map((device) => (
                                <button
                                    key={device.id}
                                    onClick={() => setSelectedDevice(selectedDevice === device.id ? null : device.id)}
                                    className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${selectedDevice === device.id
                                        ? "border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/5"
                                        : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-800/50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <StatusDot status={device.status} />
                                            <div>
                                                <div className="font-medium text-white text-sm">{device.deviceName}</div>
                                                <div className="text-[11px] text-neutral-500">{device.osVersion}</div>
                                            </div>
                                        </div>
                                        <RiskGauge score={device.riskScore} size="sm" />
                                    </div>

                                    {/* Expanded View */}
                                    {selectedDevice === device.id && (
                                        <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3 animate-in fade-in duration-200">
                                            <div className="grid grid-cols-2 gap-2">
                                                <MetricBar label="CPU" value={device.cpuPercent} icon={Cpu} color="cyan" />
                                                <MetricBar label="Memory" value={device.memoryPercent} icon={HardDrive} color="purple" />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-neutral-400">
                                                <span className="flex items-center gap-1">
                                                    <Activity className="h-3 w-3" />
                                                    {device.activeProcesses} processes
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Network className="h-3 w-3" />
                                                    {device.activeConnections} connections
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {device.totalThreats} threats
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                                                <Clock className="h-3 w-3" />
                                                Last seen: {formatTime(device.lastSeen)}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Threats Panel */}
                <div className="lg:col-span-3">
                    <Card variant="elevated" className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Skull className="h-4 w-4 text-red-400" />
                                Threat Alerts
                                {stats.activeThreats > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                                        {stats.activeThreats}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {stats.recentThreats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[200px] text-neutral-500">
                                    <Shield className="h-10 w-10 mb-3 text-emerald-400/50" />
                                    <span className="text-sm">No threats detected</span>
                                    <span className="text-xs mt-1">All endpoints are secure</span>
                                </div>
                            ) : (
                                stats.recentThreats
                                    .filter((t) => !selectedDevice || t.deviceId === selectedDevice)
                                    .map((threat) => (
                                        <div
                                            key={threat.id}
                                            className={`rounded-xl border p-4 transition-all duration-200 ${threat.isResolved
                                                ? "border-neutral-800/50 bg-neutral-900/30 opacity-60"
                                                : threat.severity === "critical"
                                                    ? "border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5"
                                                    : threat.severity === "high"
                                                        ? "border-orange-500/20 bg-orange-500/5"
                                                        : "border-neutral-800 bg-neutral-900/50"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-sm font-semibold text-white">
                                                            {threat.processName}
                                                        </span>
                                                        <SeverityBadge severity={threat.severity} />
                                                        <span className="text-[10px] text-neutral-500">
                                                            PID: {threat.pid}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                                                        {threat.reason}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-4 text-[11px] text-neutral-500">
                                                        <span className="flex items-center gap-1">
                                                            <Monitor className="h-3 w-3" />
                                                            {threat.deviceName}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTime(threat.detectedAt)}
                                                        </span>
                                                        {threat.isResolved ? (
                                                            <span className="flex items-center gap-1 text-emerald-400">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Resolved
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-amber-400">
                                                                <Eye className="h-3 w-3" />
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    {/* Anomaly Score */}
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${threat.anomalyScore >= 0.85
                                                            ? "text-red-400"
                                                            : threat.anomalyScore >= 0.7
                                                                ? "text-orange-400"
                                                                : "text-amber-400"
                                                            }`}>
                                                            {(threat.anomalyScore * 100).toFixed(0)}%
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500">Anomaly</div>
                                                    </div>

                                                    {/* Action Button */}
                                                    {!threat.isResolved && threat.actionTaken !== "kill_process" && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-7 text-[11px] bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleKillProcess(threat);
                                                            }}
                                                            disabled={killingProcess === threat.id}
                                                        >
                                                            {killingProcess === threat.id ? (
                                                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                            )}
                                                            Kill Process
                                                        </Button>
                                                    )}
                                                    {threat.actionTaken === "kill_process" && (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                                                            <Zap className="h-3 w-3" />
                                                            Auto-Killed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Activity Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Threat Trend */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-orange-400" />
                            Threat Trend (7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-40">
                            {stats.threatTrend.map((point, i) => {
                                const maxVal = Math.max(...stats.threatTrend.map((p) => p.threats), 1);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex flex-col items-center gap-[2px]" style={{ height: "120px" }}>
                                            <div
                                                className="w-full rounded-t bg-gradient-to-t from-red-500/60 to-red-400/40 transition-all duration-500"
                                                style={{ height: `${(point.threats / maxVal) * 100}%` }}
                                            />
                                            <div
                                                className="w-full rounded-t bg-gradient-to-t from-emerald-500/60 to-emerald-400/40 transition-all duration-500"
                                                style={{ height: `${(point.blocked / maxVal) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-neutral-500 whitespace-nowrap">
                                            {point.date.slice(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-400" />
                                Detected
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Blocked
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* System Activity */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-purple-400" />
                            Endpoint Activity (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-[3px] h-40">
                            {stats.activityChart.map((point, i) => {
                                const maxVal = Math.max(...stats.activityChart.map((p) => p.processes), 1);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center" title={`${point.hour}`}>
                                        <div
                                            className="w-full rounded-t bg-gradient-to-t from-purple-500/50 to-orange-400/30 transition-all duration-300"
                                            style={{
                                                height: `${(point.processes / maxVal) * 120}px`,
                                                opacity: 0.4 + (point.connections / 100) * 0.6,
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-500 mt-1">
                            <span>00:00</span>
                            <span>06:00</span>
                            <span>12:00</span>
                            <span>18:00</span>
                            <span>23:00</span>
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-purple-400" />
                                Processes
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-orange-400" />
                                Connections
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Model & At-Risk Summary */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* AI Model Status */}
                <Card variant="elevated" className="border-purple-500/20">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                            <Brain className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">AI Detection Engine</h3>
                            <p className="text-sm text-neutral-400">
                                {stats.modelStatus === "trained"
                                    ? `Isolation Forest trained (${stats.trainingSamples} samples)`
                                    : `Heuristic mode • ${stats.trainingSamples} samples collected`}
                            </p>
                            {stats.modelStatus !== "trained" && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                                        <span>Training progress</span>
                                        <span>{Math.min(100, Math.round((stats.trainingSamples / 200) * 100))}%</span>
                                    </div>
                                    <Progress value={Math.min(100, (stats.trainingSamples / 200) * 100)} className="h-1.5" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* At-Risk Devices */}
                <Card variant="elevated" className={stats.atRiskDevices > 0 ? "border-red-500/20" : "border-emerald-500/20"}>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stats.atRiskDevices > 0 ? "bg-red-500/20" : "bg-emerald-500/20"
                            }`}>
                            {stats.atRiskDevices > 0 ? (
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            ) : (
                                <Shield className="h-6 w-6 text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">
                                {stats.atRiskDevices > 0 ? `${stats.atRiskDevices} Devices At Risk` : "All Devices Secure"}
                            </h3>
                            <p className="text-sm text-neutral-400">
                                {stats.atRiskDevices > 0
                                    ? "Immediate attention required"
                                    : "No critical threats detected"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Auto-Response Stats */}
                <Card variant="elevated" className="border-amber-500/20">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                            <Zap className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Auto-Response Active</h3>
                            <p className="text-sm text-neutral-400">
                                {stats.processesKilled} threats neutralized automatically
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ============================================
// Helper Components
// ============================================

function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    pulse = false,
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    pulse?: boolean;
}) {
    const colorStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
        cyan: { bg: "from-orange-500/20 to-amber-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "shadow-orange-500/10" },
        red: { bg: "from-red-500/20 to-red-500/5", text: "text-red-400", border: "border-red-500/20", glow: "shadow-red-500/10" },
        amber: { bg: "from-amber-500/20 to-amber-500/5", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
        emerald: { bg: "from-emerald-500/20 to-emerald-500/5", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
        purple: { bg: "from-purple-500/20 to-purple-500/5", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/10" },
    };
    const s = colorStyles[color] || colorStyles.cyan;

    return (
        <Card variant="elevated" className={`border ${s.border} ${pulse ? "shadow-lg " + s.glow : ""}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.bg}`}>
                        <Icon className={`h-5 w-5 ${s.text} ${pulse ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{value}</div>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-xs font-medium text-neutral-300">{title}</div>
                    <div className="text-[11px] text-neutral-500">{subtitle}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function MetricBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    const barColor = value > 85 ? "bg-red-500" : value > 60 ? "bg-amber-500" : color === "cyan" ? "bg-orange-500" : "bg-purple-500";
    return (
        <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1 text-neutral-400">
                    <Icon className="h-3 w-3" />
                    {label}
                </span>
                <span className={`font-semibold ${value > 85 ? "text-red-400" : "text-neutral-300"}`}>{Math.round(value)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-800">
                <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
        </div>
    );
}

function EndpointDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 w-64 rounded-lg bg-neutral-800" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-neutral-800/50 border border-neutral-700/50" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="h-96 rounded-xl bg-neutral-800/50 border border-neutral-700/50 lg:col-span-2" />
                <div className="h-96 rounded-xl bg-neutral-800/50 border border-neutral-700/50 lg:col-span-3" />
            </div>
        </div>
    );
}
