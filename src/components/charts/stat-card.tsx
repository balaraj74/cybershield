"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: "default" | "critical" | "warning" | "success" | "info";
    className?: string;
}

const variantStyles = {
    default: {
        iconBg: "bg-neutral-800",
        iconColor: "text-neutral-400",
        valueColor: "text-white",
        sparkColor: "#737373",
        trendColor: "text-neutral-400",
    },
    critical: {
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        valueColor: "text-red-400",
        sparkColor: "#ef4444",
        trendColor: "text-red-400",
    },
    warning: {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        valueColor: "text-orange-400",
        sparkColor: "#f97316",
        trendColor: "text-orange-400",
    },
    success: {
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        valueColor: "text-emerald-400",
        sparkColor: "#22c55e",
        trendColor: "text-emerald-400",
    },
    info: {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        valueColor: "text-white",
        sparkColor: "#e85d04",
        trendColor: "text-orange-400",
    },
};

// Simple sparkline bars
function MiniSparkline({ color, variant }: { color: string; variant: string }) {
    // Different bar patterns per variant
    const patterns: Record<string, number[]> = {
        default: [3, 5, 4, 7, 6, 8, 5, 7, 9, 6, 8, 7],
        critical: [6, 4, 7, 5, 8, 6, 4, 7, 3, 5, 4, 6],
        warning: [2, 4, 3, 6, 5, 7, 8, 6, 5, 7, 6, 5],
        success: [4, 5, 6, 5, 7, 8, 7, 9, 8, 7, 8, 9],
        info: [5, 6, 4, 7, 5, 8, 6, 7, 5, 8, 7, 6],
    };
    const bars = patterns[variant] || patterns.default;

    return (
        <div className="flex items-end gap-[2px] h-8">
            {bars.map((h, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-sm transition-all"
                    style={{
                        height: `${h * 3.2}px`,
                        backgroundColor: color,
                        opacity: 0.6 + (i / bars.length) * 0.4,
                    }}
                />
            ))}
        </div>
    );
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = "default",
    className,
}: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <Card
            className={cn(
                "relative overflow-hidden border-neutral-800/30 bg-[#111111] hover:bg-[#141414] transition-all duration-300",
                className
            )}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{title}</p>
                            {trend && (
                                <span className={cn("text-[10px] font-semibold", styles.trendColor)}>
                                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-end gap-3">
                            <p className={cn("text-2xl font-bold tracking-tight", styles.valueColor)}>
                                {value}
                            </p>
                            <MiniSparkline color={styles.sparkColor} variant={variant} />
                        </div>
                        {subtitle && (
                            <p className="text-[11px] text-neutral-600">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
