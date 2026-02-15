import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-lg border bg-neutral-900/60 px-4 py-2 text-sm text-neutral-100 shadow-sm transition-all duration-200",
                    "placeholder:text-neutral-500",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-100",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950",
                    error
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : "border-neutral-700/50 focus:border-orange-500/50 focus:ring-orange-500/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "hover:border-neutral-600",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
