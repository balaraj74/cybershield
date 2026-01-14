"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
    date: string;
    count: number;
}

interface ThreatTrendChartProps {
    data: DataPoint[];
    title?: string;
}

// Custom tooltip component
function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-lg font-semibold text-white">
                    {payload[0].value}{" "}
                    <span className="text-sm font-normal text-slate-400">threats</span>
                </p>
            </div>
        );
    }
    return null;
}

export function ThreatTrendChart({
    data,
    title = "Threats Over Time",
}: ThreatTrendChartProps) {
    return (
        <Card variant="elevated">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#334155"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 6,
                                    fill: "#06b6d4",
                                    stroke: "#0e7490",
                                    strokeWidth: 2,
                                }}
                                fill="url(#threatGradient)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
