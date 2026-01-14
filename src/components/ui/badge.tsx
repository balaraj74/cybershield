import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getSeverityColors } from "@/lib/utils";
import type { SeverityLevel } from "@/types";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-slate-800 text-slate-300",
                secondary: "border-transparent bg-slate-700 text-slate-300",
                outline: "text-slate-300 border border-slate-600",
                success: "border-transparent bg-emerald-500/20 text-emerald-400",
                warning: "border-transparent bg-yellow-500/20 text-yellow-400",
                danger: "border-transparent bg-red-500/20 text-red-400",
                info: "border-transparent bg-cyan-500/20 text-cyan-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

// Severity-specific badge component
interface SeverityBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    severity: SeverityLevel;
}

function SeverityBadge({ severity, className, ...props }: SeverityBadgeProps) {
    const colors = getSeverityColors(severity);
    const labels: Record<SeverityLevel, string> = {
        critical: "Critical",
        high: "High Risk",
        medium: "Medium",
        low: "Low Risk",
        safe: "Safe",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                colors.bg,
                colors.text,
                colors.border,
                "border",
                className
            )}
            {...props}
        >
            <span
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    severity === "critical" ? "bg-red-400 animate-pulse" : colors.text.replace("text-", "bg-")
                )}
            />
            {labels[severity]}
        </div>
    );
}

export { Badge, badgeVariants, SeverityBadge };
