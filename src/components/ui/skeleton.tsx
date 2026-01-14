import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "circular" | "text";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-slate-800/50",
                variant === "default" && "rounded-lg",
                variant === "circular" && "rounded-full",
                variant === "text" && "rounded h-4",
                className
            )}
            {...props}
        />
    );
}

// Pre-built skeleton components for common use cases
function CardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" variant="circular" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

// Static heights to avoid hydration mismatch (Math.random() differs between server/client)
const CHART_BAR_HEIGHTS = [65, 80, 45, 90, 55, 75, 60];

function ChartSkeleton() {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex items-end justify-between gap-2 h-48 pt-4">
                {CHART_BAR_HEIGHTS.map((height, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 border-b border-slate-800 p-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4" />
                ))}
            </div>
            {/* Rows */}
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 border-b border-slate-800/50 p-4 last:border-0">
                    {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-4" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
            {/* Table */}
            <TableSkeleton />
        </div>
    );
}

function AnalysisResultSkeleton() {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-28 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="space-y-4">
                <Skeleton className="h-5 w-36" />
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-12" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export {
    Skeleton,
    CardSkeleton,
    ChartSkeleton,
    TableSkeleton,
    DashboardSkeleton,
    AnalysisResultSkeleton,
};
