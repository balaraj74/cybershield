import { Suspense } from "react";
import { MainLayout } from "@/components/layout";

export const metadata = {
    title: "Endpoint Protection",
    description: "AI-powered endpoint monitoring with behavioral anomaly detection, real-time threat alerts, and automatic threat response.",
};

export default function EndpointLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MainLayout>
            <Suspense fallback={null}>{children}</Suspense>
        </MainLayout>
    );
}
