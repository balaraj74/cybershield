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
        iconBg: "bg-slate-800",
        iconColor: "text-slate-400",
        valueColor: "text-white",
    },
    critical: {
        iconBg: "bg-red-500/20",
        iconColor: "text-red-400",
        valueColor: "text-red-400",
    },
    warning: {
        iconBg: "bg-orange-500/20",
        iconColor: "text-orange-400",
        valueColor: "text-orange-400",
    },
    success: {
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-400",
        valueColor: "text-emerald-400",
    },
    info: {
        iconBg: "bg-cyan-500/20",
        iconColor: "text-cyan-400",
        valueColor: "text-cyan-400",
    },
};

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
            variant="elevated"
            className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-0.5",
                className
            )}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-400">{title}</p>
                        <p className={cn("text-3xl font-bold", styles.valueColor)}>
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-sm text-slate-500">{subtitle}</p>
                        )}
                        {trend && (
                            <div className="flex items-center gap-1">
                                <span
                                    className={cn(
                                        "text-xs font-medium",
                                        trend.isPositive ? "text-emerald-400" : "text-red-400"
                                    )}
                                >
                                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                                </span>
                                <span className="text-xs text-slate-500">vs last period</span>
                            </div>
                        )}
                    </div>
                    <div
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            styles.iconBg
                        )}
                    >
                        <Icon className={cn("h-6 w-6", styles.iconColor)} />
                    </div>
                </div>

                {/* Decorative gradient */}
                <div
                    className={cn(
                        "absolute -bottom-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-10",
                        variant === "critical" && "bg-red-500",
                        variant === "warning" && "bg-orange-500",
                        variant === "success" && "bg-emerald-500",
                        variant === "info" && "bg-cyan-500",
                        variant === "default" && "bg-slate-500"
                    )}
                />
            </CardContent>
        </Card>
    );
}
