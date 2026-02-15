import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:from-orange-500 hover:to-orange-400",
                destructive:
                    "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/35 hover:from-red-500 hover:to-rose-500",
                outline:
                    "border border-neutral-700/60 bg-transparent text-neutral-300 hover:bg-neutral-800/60 hover:text-white hover:border-neutral-600",
                secondary:
                    "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white",
                ghost:
                    "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200",
                link: "text-orange-400 underline-offset-4 hover:underline hover:text-orange-300",
                success:
                    "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35",
                warning:
                    "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <>
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        {children}
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
