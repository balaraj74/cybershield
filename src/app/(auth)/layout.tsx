import { Suspense } from "react";

export const metadata = {
    title: "Login",
    description: "Sign in to CyberShield AI",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Suspense fallback={null}>{children}</Suspense>;
}
