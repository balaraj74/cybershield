"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn, getSeverityColors } from "@/lib/utils";
import type { SeverityLevel } from "@/types";

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
        indicatorClassName?: string;
    }
>(({ className, value, indicatorClassName, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-slate-800",
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className={cn(
                "h-full w-full flex-1 transition-all duration-500 ease-out",
                indicatorClassName || "bg-gradient-to-r from-cyan-500 to-blue-500"
            )}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Risk Score Progress with severity colors
interface RiskProgressProps
    extends Omit<
        React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
        "value"
    > {
    value: number;
    showLabel?: boolean;
}

function RiskProgress({
    value,
    showLabel = true,
    className,
    ...props
}: RiskProgressProps) {
    // Determine severity based on risk score
    const getSeverity = (score: number): SeverityLevel => {
        if (score >= 80) return "critical";
        if (score >= 60) return "high";
        if (score >= 40) return "medium";
        if (score >= 20) return "low";
        return "safe";
    };

    const severity = getSeverity(value);
    const colors = getSeverityColors(severity);

    const gradientMap: Record<SeverityLevel, string> = {
        critical: "bg-gradient-to-r from-red-600 to-red-400",
        high: "bg-gradient-to-r from-orange-600 to-orange-400",
        medium: "bg-gradient-to-r from-yellow-600 to-yellow-400",
        low: "bg-gradient-to-r from-blue-600 to-blue-400",
        safe: "bg-gradient-to-r from-emerald-600 to-emerald-400",
    };

    return (
        <div className={cn("space-y-1", className)}>
            {showLabel && (
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Risk Score</span>
                    <span className={cn("font-semibold", colors.text)}>{value}%</span>
                </div>
            )}
            <Progress
                value={value}
                indicatorClassName={gradientMap[severity]}
                {...props}
            />
        </div>
    );
}

export { Progress, RiskProgress };
