"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ThreatType } from "@/types";

interface ThreatCategoryData {
    name: string;
    value: number;
    color: string;
}

interface ThreatCategoryChartProps {
    data: Record<ThreatType, number>;
    title?: string;
}

// Warm color mapping for threat types
const threatColors: Record<ThreatType, string> = {
    phishing: "#ef4444",
    malware: "#f97316",
    spam: "#f59e0b",
    social_engineering: "#d946ef",
    credential_theft: "#f43f5e",
    url_threat: "#ea580c",
    data_exfiltration: "#dc2f02",
    unknown: "#737373",
};

// Human-readable labels
const threatLabels: Record<ThreatType, string> = {
    phishing: "Phishing",
    malware: "Malware",
    spam: "Spam",
    social_engineering: "Social Eng.",
    credential_theft: "Credential Theft",
    url_threat: "URL Threat",
    data_exfiltration: "Data Exfil.",
    unknown: "Unknown",
};

// Custom tooltip
function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: ThreatCategoryData }>;
}) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-panel p-3 rounded-lg shadow-2xl relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: `radial-gradient(circle at top right, ${data.color}, transparent 70%)` }}
                />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: data.color, color: data.color }}
                        />
                        <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{data.name}</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                        {data.value}{" "}
                        <span className="text-xs font-medium text-neutral-500">detected</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

export function ThreatCategoryChart({
    data,
    title = "Threats by Category",
}: ThreatCategoryChartProps) {
    // Transform data for the chart
    const chartData: ThreatCategoryData[] = Object.entries(data)
        .map(([key, value]) => ({
            name: threatLabels[key as ThreatType] || key,
            value,
            color: threatColors[key as ThreatType] || "#525252",
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

    return (
        <Card className="glass-panel border-neutral-800/40 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <CardHeader>
                <CardTitle className="text-base font-semibold tracking-wide text-neutral-200">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full mt-2 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff10"
                                horizontal={true}
                                vertical={false}
                            />
                            <XAxis type="number" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#737373"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={110}
                                tick={{ fill: '#a3a3a3' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                maxBarSize={24}
                                animationDuration={1500}
                                className="drop-shadow-lg"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} className="opacity-90 hover:opacity-100 transition-opacity duration-300" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
