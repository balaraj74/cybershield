import { MainLayout } from "@/components/layout";

export const metadata = {
    title: "Settings",
    description: "Configure your security preferences",
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainLayout>{children}</MainLayout>;
}
