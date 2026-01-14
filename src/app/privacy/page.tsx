import {
    Shield,
    Lock,
    Eye,
    Trash2,
    Server,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MainLayout } from "@/components/layout";

export const metadata = {
    title: "Privacy Policy",
    description: "CyberShield AI privacy and data handling policies",
};

export default function PrivacyPage() {
    const dataTypes = [
        {
            type: "Raw Input Content",
            retained: false,
            duration: "Immediately deleted",
            icon: Trash2,
            description: "Emails, URLs, and messages submitted for analysis are never stored.",
        },
        {
            type: "Threat Indicators",
            retained: true,
            duration: "30 days (configurable)",
            icon: AlertCircle,
            description: "Anonymized patterns detected during analysis for improving detection.",
        },
        {
            type: "Analysis Results",
            retained: true,
            duration: "Based on your settings",
            icon: CheckCircle,
            description: "Risk scores and threat types without any identifiable content.",
        },
        {
            type: "Hash References",
            retained: true,
            duration: "Same as results",
            icon: Lock,
            description: "One-way hashes for reference - cannot be reversed to original content.",
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    Privacy-First Security
                                </h1>
                                <p className="mt-1 text-lg text-slate-400">
                                    Your privacy is our priority
                                </p>
                            </div>
                        </div>
                        <p className="mt-6 max-w-2xl text-slate-300">
                            CyberShield AI is built with privacy at its core. We believe effective
                            security shouldn't compromise your data rights. Here's exactly how
                            we handle your information.
                        </p>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                {/* Core Principles */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card variant="elevated" className="text-center">
                        <CardContent className="pt-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                                <Trash2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h3 className="mt-4 font-semibold text-white">No Raw Storage</h3>
                            <p className="mt-2 text-sm text-slate-400">
                                Original content is processed in memory and immediately
                                discarded after analysis
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated" className="text-center">
                        <CardContent className="pt-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                                <Lock className="h-6 w-6 text-cyan-400" />
                            </div>
                            <h3 className="mt-4 font-semibold text-white">Hash-Only References</h3>
                            <p className="mt-2 text-sm text-slate-400">
                                We use one-way cryptographic hashes for record-keeping
                                that cannot be reversed
                            </p>
                        </CardContent>
                    </Card>

                    <Card variant="elevated" className="text-center">
                        <CardContent className="pt-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                                <Eye className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="mt-4 font-semibold text-white">Transparent Handling</h3>
                            <p className="mt-2 text-sm text-slate-400">
                                Full visibility into what data exists and complete
                                control over its retention
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Handling Table */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle>Data Retention Policy</CardTitle>
                        <CardDescription>
                            Exactly what data we collect and how long we keep it
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dataTypes.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                                    >
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.retained
                                                    ? "bg-cyan-500/20"
                                                    : "bg-emerald-500/20"
                                                }`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${item.retained ? "text-cyan-400" : "text-emerald-400"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-medium text-white">{item.type}</h4>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.retained
                                                            ? "bg-cyan-500/20 text-cyan-400"
                                                            : "bg-emerald-500/20 text-emerald-400"
                                                        }`}
                                                >
                                                    {item.retained ? "Retained" : "Not Stored"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-400">
                                                {item.description}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                <span>{item.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Technical Measures */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle>Technical Security Measures</CardTitle>
                        <CardDescription>
                            How we protect your data at every level
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">TLS 1.3 encryption in transit</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">AES-256 encryption at rest</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">Secure API gateway with rate limiting</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">Role-based access control (RBAC)</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">JWT token-based authentication</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">Content Security Policy (CSP) headers</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">Input sanitization and validation</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    <span className="text-slate-300">Audit logging (without PII)</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Your Rights */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle>Your Rights</CardTitle>
                        <CardDescription>
                            You have complete control over your data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                                <h4 className="font-medium text-white">Right to Access</h4>
                                <p className="mt-2 text-sm text-slate-400">
                                    View all anonymized records associated with your account
                                    in the History section.
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                                <h4 className="font-medium text-white">Right to Deletion</h4>
                                <p className="mt-2 text-sm text-slate-400">
                                    Request complete deletion of your account and all
                                    associated records at any time.
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                                <h4 className="font-medium text-white">Right to Export</h4>
                                <p className="mt-2 text-sm text-slate-400">
                                    Download your analysis history and settings in
                                    a portable format.
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                                <h4 className="font-medium text-white">Right to Configure</h4>
                                <p className="mt-2 text-sm text-slate-400">
                                    Adjust retention periods and anonymization settings
                                    in your preferences.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Last Updated */}
                <div className="text-center text-sm text-slate-500">
                    <p>Last updated: January 2026 • Version 1.0</p>
                    <p className="mt-1">
                        Questions about privacy? Contact security@cybershield.ai
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
