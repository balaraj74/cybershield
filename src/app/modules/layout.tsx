import { Suspense } from "react";
import { MainLayout } from "@/components/layout";

export const metadata = {
    title: "AI Security Modules | CyberShield AI",
    description: "9 specialized AI-powered security engines for threat detection, compliance, and risk management.",
};

export default function ModulesLayout({
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
