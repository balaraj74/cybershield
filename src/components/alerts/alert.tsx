import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle, AlertCircle } from "lucide-react";

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    {
        variants: {
            variant: {
                default: "bg-slate-900/50 border-slate-700 text-slate-100",
                destructive: "border-red-500/50 bg-red-500/10 text-red-400 [&>svg]:text-red-400",
                warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 [&>svg]:text-yellow-400",
                success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 [&>svg]:text-emerald-400",
                info: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 [&>svg]:text-cyan-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
    />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
        {...props}
    />
));
AlertDescription.displayName = "AlertDescription";

// Pre-configured alert variants with icons
interface AlertWithIconProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    children: React.ReactNode;
}

function SuccessAlert({ title, children, className, ...props }: AlertWithIconProps) {
    return (
        <Alert variant="success" className={className} {...props}>
            <CheckCircle className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}

function ErrorAlert({ title, children, className, ...props }: AlertWithIconProps) {
    return (
        <Alert variant="destructive" className={className} {...props}>
            <XCircle className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}

function WarningAlert({ title, children, className, ...props }: AlertWithIconProps) {
    return (
        <Alert variant="warning" className={className} {...props}>
            <AlertTriangle className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}

function InfoAlert({ title, children, className, ...props }: AlertWithIconProps) {
    return (
        <Alert variant="info" className={className} {...props}>
            <Info className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}

function CriticalAlert({ title, children, className, ...props }: AlertWithIconProps) {
    return (
        <Alert variant="destructive" className={cn("animate-pulse border-red-400", className)} {...props}>
            <AlertCircle className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    );
}

export {
    Alert,
    AlertTitle,
    AlertDescription,
    SuccessAlert,
    ErrorAlert,
    WarningAlert,
    InfoAlert,
    CriticalAlert,
};
