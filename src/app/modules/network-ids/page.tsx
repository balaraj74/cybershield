"use client";

import { useEffect, useState, useCallback } from "react";
import { Network, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

interface Alert {
    alert_id: string;
    alert_type: string;
    severity: string;
    confidence: number;
    source_ip: string;
    dest_ip?: string;
    dest_port?: number;
    process_name?: string;
    description: string;
    indicators: string[];
    recommended_action: string;
    timestamp: string;
}

interface Stats {
    total_alerts: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    dns_queries_tracked: number;
    connections_tracked: number;
    active_port_scans: number;
}

const sevColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-orange-500/20 text-blue-400 border-orange-500/30",
};

const typeLabels: Record<string, string> = {
    dns_anomaly: "DNS Anomaly",
    port_scan: "Port Scan",
    exfiltration: "Data Exfiltration",
    c2_beacon: "C2 Beacon",
    lateral_movement: "Lateral Movement",
};

export default function NetworkIDSPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filter, setFilter] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, alertsRes] = await Promise.all([
                fetch(`${FASTAPI_URL}/api/v1/modules/network-ids/stats`),
                fetch(`${FASTAPI_URL}/api/v1/modules/network-ids/alerts${filter ? `?alert_type=${filter}` : ""}`),
            ]);
            if (statsRes.ok) setStats((await statsRes.json()).stats);
            if (alertsRes.ok) setAlerts((await alertsRes.json()).alerts || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Network Intrusion Detection</h1>
                    <p className="mt-1 text-neutral-500">Deep packet analysis • DNS anomaly • C2 beacon detection</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Total Alerts</p>
                        <p className="text-2xl font-bold text-white">{stats?.total_alerts || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">DNS Queries Tracked</p>
                        <p className="text-2xl font-bold text-amber-400">{stats?.dns_queries_tracked || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Connections</p>
                        <p className="text-2xl font-bold text-orange-400">{stats?.connections_tracked || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Active Port Scans</p>
                        <p className="text-2xl font-bold text-red-400">{stats?.active_port_scans || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Type Filter Buttons */}
            {stats?.by_type && Object.keys(stats.by_type).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.by_type).map(([type, count]) => (
                        <button
                            key={type}
                            onClick={() => setFilter(filter === type ? "" : type)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${filter === type ? "bg-amber-500/20 text-amber-300 border-amber-500/50" : "bg-neutral-800/50 text-neutral-500 border-neutral-700/50 hover:bg-neutral-700/50"}`}
                        >
                            {typeLabels[type] || type}: {count}
                        </button>
                    ))}
                    {filter && (
                        <button onClick={() => setFilter("")} className="rounded-lg px-3 py-1.5 text-xs bg-neutral-700/50 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-600/50">
                            Clear Filter
                        </button>
                    )}
                </div>
            )}

            {/* Alerts List */}
            <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Network Alerts
                    </CardTitle>
                    <span className="text-xs text-neutral-600">{alerts.length} alerts</span>
                </CardHeader>
                <CardContent>
                    {alerts.length === 0 ? (
                        <div className="py-12 text-center">
                            <Shield className="h-12 w-12 text-emerald-400/30 mx-auto mb-3" />
                            <p className="text-neutral-500 text-sm">No network intrusion alerts detected</p>
                            <p className="text-neutral-600 text-xs mt-1">The network is clean — monitoring continues</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div key={alert.alert_id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${sevColors[alert.severity] || sevColors.low}`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs font-medium text-neutral-400">
                                                {typeLabels[alert.alert_type] || alert.alert_type}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-neutral-600">{alert.confidence ? `${(alert.confidence * 100).toFixed(0)}% confidence` : ""}</span>
                                    </div>
                                    <p className="text-sm text-white mb-2">{alert.description}</p>
                                    {alert.indicators.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {alert.indicators.map((ind, i) => (
                                                <span key={i} className="rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] text-neutral-500">{ind}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-[10px] text-neutral-600">
                                        {alert.process_name && <span>Process: {alert.process_name}</span>}
                                        {alert.dest_ip && <span>Dest: {alert.dest_ip}:{alert.dest_port}</span>}
                                        <span>Action: {alert.recommended_action}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
