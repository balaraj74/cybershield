import { MainLayout } from "@/components/layout";

export const metadata = {
    title: "History",
    description: "View past threat analysis records",
};

export default function HistoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainLayout>{children}</MainLayout>;
}
