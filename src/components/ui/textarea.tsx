import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[120px] w-full rounded-lg border bg-neutral-900/50 px-4 py-3 text-sm text-neutral-100 shadow-sm transition-all duration-200",
                    "placeholder:text-neutral-500",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950",
                    error
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : "border-neutral-700 focus:border-orange-500/50 focus:ring-orange-500/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "hover:border-neutral-600",
                    "resize-none",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";

export { Textarea };
