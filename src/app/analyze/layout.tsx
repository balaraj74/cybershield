import { Suspense } from "react";
import { MainLayout } from "@/components/layout";

export const metadata = {
    title: "Threat Analysis",
    description: "Analyze emails, URLs, and messages for security threats",
};

export default function AnalyzeLayout({
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
