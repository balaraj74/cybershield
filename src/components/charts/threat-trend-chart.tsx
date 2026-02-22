"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
            <div className="glass-panel p-3 rounded-lg shadow-[0_0_30px_-5px_rgba(232,93,4,0.4)]">
                <p className="text-xs text-neutral-400 font-medium mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_theme(colors.orange.500)]" />
                    <p className="text-xl font-bold text-white">
                        {payload[0].value}{" "}
                        <span className="text-sm font-medium text-neutral-500">threats</span>
                    </p>
                </div>
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
        <Card className="glass-panel border-neutral-800/40 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <CardHeader>
                <CardTitle className="text-base font-semibold tracking-wide text-neutral-200">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full mt-2 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="threatAreaColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f48c06" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#dc2f02" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff10"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                stroke="#737373"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#737373"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#f48c06"
                                strokeWidth={3}
                                strokeLinecap="round"
                                fillOpacity={1}
                                fill="url(#threatAreaColor)"
                                animationDuration={1500}
                                activeDot={{
                                    r: 6,
                                    fill: "#0a0a0a",
                                    stroke: "#f48c06",
                                    strokeWidth: 3,
                                    className: "drop-shadow-[0_0_8px_rgba(244,140,6,0.8)]"
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
