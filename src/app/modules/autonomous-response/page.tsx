"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, ShieldOff, Ban, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export default function AutonomousResponsePage() {
    const [capabilities, setCapabilities] = useState<any>(null);
    const [model, setModel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionResult, setActionResult] = useState<any>(null);
    const [isolateId, setIsolateId] = useState("");
    const [blockIp, setBlockIp] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [capRes, modRes] = await Promise.all([
                fetch(`${FASTAPI_URL}/api/v1/modules/response/capabilities`),
                fetch(`${FASTAPI_URL}/api/v1/modules/response/model-status`),
            ]);
            if (capRes.ok) setCapabilities(await capRes.json());
            if (modRes.ok) setModel(await modRes.json());
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleIsolate = async () => {
        if (!isolateId.trim()) return;
        try {
            const res = await fetch(`${FASTAPI_URL}/api/v1/modules/response/isolate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ device_id: isolateId.trim() }),
            });
            setActionResult(await res.json());
            setIsolateId("");
        } catch { setActionResult({ error: "Request failed" }); }
    };

    const handleBlock = async () => {
        if (!blockIp.trim()) return;
        try {
            const res = await fetch(`${FASTAPI_URL}/api/v1/modules/response/block-ip`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip: blockIp.trim() }),
            });
            setActionResult(await res.json());
            setBlockIp("");
        } catch { setActionResult({ error: "Request failed" }); }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Autonomous Response System</h1>
                    <p className="mt-1 text-neutral-500">Auto-kill • Device isolation • IP blocking • Shadow backup</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Capabilities Grid */}
            {capabilities?.capabilities && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {capabilities.capabilities.map((cap: any) => (
                        <Card key={cap.name}>
                            <CardContent className="p-4 flex items-center gap-3">
                                {cap.enabled ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white">{cap.name}</p>
                                    <p className="text-[10px] text-neutral-500">{cap.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Action Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Isolate Device */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldOff className="h-4 w-4 text-amber-400" />
                            Isolate Device
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-neutral-500 mb-3">Quarantine a compromised device from the network</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={isolateId}
                                onChange={(e) => setIsolateId(e.target.value)}
                                placeholder="Device ID"
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                            />
                            <Button onClick={handleIsolate} className="bg-amber-600 hover:bg-amber-700 text-white">
                                Isolate
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Block IP */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Ban className="h-4 w-4 text-red-400" />
                            Block IP Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-neutral-500 mb-3">Block a malicious IP across all endpoints</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={blockIp}
                                onChange={(e) => setBlockIp(e.target.value)}
                                placeholder="192.168.x.x"
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                            />
                            <Button onClick={handleBlock} className="bg-red-600 hover:bg-red-700 text-white">
                                Block
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Result */}
            {actionResult && (
                <Card variant="glass">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            {actionResult.error ? (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                            ) : (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                            )}
                            <p className="text-sm font-medium text-white">
                                {actionResult.error ? "Action Failed" : "Action Completed"}
                            </p>
                        </div>
                        <pre className="text-xs text-neutral-500 overflow-x-auto">{JSON.stringify(actionResult, null, 2)}</pre>
                    </CardContent>
                </Card>
            )}

            {/* AI Model Status */}
            {model && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">AI Response Model</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                                <p className="text-[10px] text-neutral-500 uppercase">State</p>
                                <p className="text-sm font-medium text-white">{model.model_state || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-500 uppercase">Decisions</p>
                                <p className="text-sm font-medium text-white">{model.total_decisions ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-500 uppercase">Accuracy</p>
                                <p className="text-sm font-medium text-white">{model.accuracy ? `${(model.accuracy * 100).toFixed(0)}%` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-500 uppercase">Blocked IPs</p>
                                <p className="text-sm font-medium text-white">{model.blocked_ips ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
