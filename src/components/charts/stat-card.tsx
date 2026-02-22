"use client";

import { useEffect, useState } from "react";
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
        glow: "group-hover:shadow-[0_0_20px_-5px_theme(colors.neutral.400)]",
    },
    critical: {
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        valueColor: "text-red-400",
        sparkColor: "#ef4444",
        trendColor: "text-red-400",
        glow: "group-hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]",
    },
    warning: {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        valueColor: "text-orange-400",
        sparkColor: "#f97316",
        trendColor: "text-orange-400",
        glow: "group-hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]",
    },
    success: {
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        valueColor: "text-emerald-400",
        sparkColor: "#22c55e",
        trendColor: "text-emerald-400",
        glow: "group-hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]",
    },
    info: {
        iconBg: "bg-orange-600/10",
        iconColor: "text-orange-500",
        valueColor: "text-white",
        sparkColor: "#e85d04",
        trendColor: "text-orange-500",
        glow: "group-hover:shadow-[0_0_30px_-5px_rgba(232,93,4,0.3)]",
    },
};

// Animated sparkline bars
function MiniSparkline({ color, variant }: { color: string; variant: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const patterns: Record<string, number[]> = {
        default: [3, 5, 4, 7, 6, 8, 5, 7, 9, 6, 8, 7],
        critical: [6, 4, 7, 5, 8, 6, 4, 7, 3, 5, 4, 6],
        warning: [2, 4, 3, 6, 5, 7, 8, 6, 5, 7, 6, 5],
        success: [4, 5, 6, 5, 7, 8, 7, 9, 8, 7, 8, 9],
        info: [5, 6, 4, 7, 5, 8, 6, 7, 5, 8, 7, 6],
    };
    const bars = patterns[variant] || patterns.default;

    return (
        <div className="flex items-end gap-[2px] h-8 overflow-hidden group">
            {bars.map((h, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-sm transition-all duration-700 ease-out"
                    style={{
                        height: mounted ? `${h * 3.2}px` : "2px",
                        backgroundColor: color,
                        opacity: mounted ? 0.4 + (i / bars.length) * 0.6 : 0,
                        transitionDelay: `${i * 30}ms`,
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
                "group relative overflow-hidden glass-panel border-neutral-800/40 hover:border-neutral-700 transition-all duration-500",
                styles.glow,
                className
            )}
        >
            {/* Subtle inner grid background for that tech feel */}
            <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none group-hover:opacity-[0.3] transition-opacity duration-500" />

            {/* Ambient inner glow based on variant */}
            <div
                className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500")}
                style={{ backgroundColor: styles.sparkColor }}
            />

            <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", styles.iconColor)} />
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{title}</p>
                            {trend && (
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-900/50", styles.trendColor)}>
                                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-end justify-between mt-2">
                            <p className={cn("text-3xl font-extrabold tracking-tight translate-y-1", styles.valueColor)}>
                                {value}
                            </p>
                            <div className="translate-y-1 group-hover:scale-105 transition-transform duration-300">
                                <MiniSparkline color={styles.sparkColor} variant={variant} />
                            </div>
                        </div>
                        {subtitle && (
                            <p className="text-[11px] text-neutral-500 font-medium translate-y-1">{subtitle}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
