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
    malware: "#e85d04",
    spam: "#f59e0b",
    social_engineering: "#d946ef",
    credential_theft: "#f43f5e",
    url_threat: "#f97316",
    data_exfiltration: "#dc2f02",
    unknown: "#525252",
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
            <div className="rounded-lg border border-neutral-700/50 bg-neutral-900 p-3 shadow-xl">
                <div className="flex items-center gap-2">
                    <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: data.color }}
                    />
                    <span className="text-sm font-medium text-white">{data.name}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-white">
                    {data.value}{" "}
                    <span className="text-sm font-normal text-neutral-400">detected</span>
                </p>
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
        <Card variant="elevated">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e1e1e"
                                horizontal={true}
                                vertical={false}
                            />
                            <XAxis type="number" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#525252"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={90}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#141414" }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
