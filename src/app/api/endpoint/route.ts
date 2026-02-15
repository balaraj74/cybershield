import { NextResponse } from "next/server";

// Use 127.0.0.1 instead of localhost to force IPv4
// Node.js 18+ fetch tries IPv6 first which hangs if backend is IPv4-only
const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8001";

export async function GET() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${FASTAPI_URL}/api/v1/endpoint/dashboard/stats`, {
            headers: {
                "X-API-Key": process.env.FASTAPI_API_KEY || "cybershield-api-key",
            },
            cache: "no-store",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.error(`[Endpoint API] Backend returned ${res.status}`);
            throw new Error(`Backend returned ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Endpoint API] Failed to reach backend, using demo data:", (error as Error).message);
        // Return demo data if backend is not available
        return NextResponse.json({
            success: true,
            data: getDemoData(),
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const endpoint = body.action === "kill_process" ? "kill-process" : "kill-process";

        const res = await fetch(`${FASTAPI_URL}/api/v1/endpoint/dashboard/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.FASTAPI_API_KEY || "cybershield-api-key",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ success: false, message: "Failed to execute command" }, { status: 500 });
    }
}

function getDemoData() {
    const now = new Date();

    const devices = [
        {
            id: "dev-001-demo",
            deviceName: "DESKTOP-SALES-01",
            osVersion: "Windows 11 Pro 23H2",
            status: "online",
            lastSeen: new Date(now.getTime() - 15000).toISOString(),
            riskScore: 12.0,
            riskLevel: "safe",
            cpuPercent: 34.5,
            memoryPercent: 62.3,
            activeProcesses: 147,
            activeConnections: 23,
            totalThreats: 2,
        },
        {
            id: "dev-002-demo",
            deviceName: "LAPTOP-HR-SARAH",
            osVersion: "Windows 10 Enterprise",
            status: "online",
            lastSeen: new Date(now.getTime() - 8000).toISOString(),
            riskScore: 78.5,
            riskLevel: "high",
            cpuPercent: 89.2,
            memoryPercent: 78.1,
            activeProcesses: 203,
            activeConnections: 67,
            totalThreats: 15,
        },
        {
            id: "dev-003-demo",
            deviceName: "SERVER-FILE-01",
            osVersion: "Windows Server 2022",
            status: "online",
            lastSeen: new Date(now.getTime() - 5000).toISOString(),
            riskScore: 5.0,
            riskLevel: "safe",
            cpuPercent: 22.1,
            memoryPercent: 45.8,
            activeProcesses: 89,
            activeConnections: 45,
            totalThreats: 0,
        },
        {
            id: "dev-004-demo",
            deviceName: "DESKTOP-DEV-MARK",
            osVersion: "Windows 11 Pro",
            status: "at_risk",
            lastSeen: new Date(now.getTime() - 30000).toISOString(),
            riskScore: 92.3,
            riskLevel: "critical",
            cpuPercent: 95.7,
            memoryPercent: 91.4,
            activeProcesses: 312,
            activeConnections: 156,
            totalThreats: 28,
        },
        {
            id: "dev-005-demo",
            deviceName: "LAPTOP-FINANCE-01",
            osVersion: "Windows 10 Pro",
            status: "offline",
            lastSeen: new Date(now.getTime() - 7200000).toISOString(),
            riskScore: 25.0,
            riskLevel: "low",
            cpuPercent: 0,
            memoryPercent: 0,
            activeProcesses: 0,
            activeConnections: 0,
            totalThreats: 5,
        },
    ];

    const recentThreats = [
        {
            id: "threat-001",
            deviceId: "dev-004-demo",
            deviceName: "DESKTOP-DEV-MARK",
            pid: 8472,
            processName: "cryptominer.exe",
            anomalyScore: 0.96,
            severity: "critical",
            reason: "High CPU (97.3%) with heavy disk writes; Many outbound connections (45); Unusual behavior pattern",
            actionTaken: "kill_process",
            detectedAt: new Date(now.getTime() - 180000).toISOString(),
            isResolved: true,
        },
        {
            id: "threat-002",
            deviceId: "dev-002-demo",
            deviceName: "LAPTOP-HR-SARAH",
            pid: 15234,
            processName: "svchost_update.exe",
            anomalyScore: 0.87,
            severity: "high",
            reason: "Mimicking system process name; High file write activity (234 ops); Ransomware extension detected",
            actionTaken: "kill_process",
            detectedAt: new Date(now.getTime() - 720000).toISOString(),
            isResolved: true,
        },
        {
            id: "threat-003",
            deviceId: "dev-004-demo",
            deviceName: "DESKTOP-DEV-MARK",
            pid: 22891,
            processName: "data_sync.exe",
            anomalyScore: 0.82,
            severity: "high",
            reason: "Data exfiltration pattern: 156 outbound connections to unique IPs; High upload rate",
            actionTaken: "alert",
            detectedAt: new Date(now.getTime() - 300000).toISOString(),
            isResolved: false,
        },
        {
            id: "threat-004",
            deviceId: "dev-002-demo",
            deviceName: "LAPTOP-HR-SARAH",
            pid: 9102,
            processName: "powershell.exe",
            anomalyScore: 0.71,
            severity: "medium",
            reason: "Unexpected PowerShell execution with encoded commands; Network activity detected",
            actionTaken: "alert",
            detectedAt: new Date(now.getTime() - 1500000).toISOString(),
            isResolved: false,
        },
        {
            id: "threat-005",
            deviceId: "dev-001-demo",
            deviceName: "DESKTOP-SALES-01",
            pid: 4521,
            processName: "update_helper.exe",
            anomalyScore: 0.65,
            severity: "medium",
            reason: "Unknown process with network activity; Not in known software inventory",
            actionTaken: "alert",
            detectedAt: new Date(now.getTime() - 3600000).toISOString(),
            isResolved: false,
        },
    ];

    const threatTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 86400000);
        const threats = Math.floor(Math.random() * 15) + 2;
        return {
            date: d.toISOString().split("T")[0],
            threats,
            blocked: Math.floor(threats * (0.6 + Math.random() * 0.3)),
        };
    });

    const activityChart = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, "0")}:00`,
        processes: i >= 8 && i <= 18 ? 100 + Math.floor(Math.random() * 100) : 50 + Math.floor(Math.random() * 30),
        connections: 15 + Math.floor(Math.random() * 65),
        fileEvents: 3 + Math.floor(Math.random() * 37),
    }));

    return {
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => d.status === "online" || d.status === "at_risk").length,
        atRiskDevices: devices.filter((d) => d.riskLevel === "high" || d.riskLevel === "critical").length,
        totalThreatsToday: 8,
        totalThreatsAll: 50,
        activeThreats: recentThreats.filter((t) => !t.isResolved).length,
        avgRiskScore: Math.round((devices.reduce((a, d) => a + d.riskScore, 0) / devices.length) * 10) / 10,
        processesKilled: 12,
        modelStatus: "heuristic",
        trainingSamples: 847,
        devices,
        recentThreats,
        threatTrend,
        activityChart,
    };
}
