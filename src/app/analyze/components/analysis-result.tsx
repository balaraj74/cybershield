"use client";

import {
    Shield,
    AlertTriangle,
    Info,
    ChevronRight,
    Copy,
    Check,
    Lock,
    MousePointerClick,
    Flag,
    Ban,
    Key,
    RefreshCcw,
    ShieldCheck,
    ShieldAlert,
    ThumbsUp,
    CircleAlert,
    BarChart3,
    Sparkles,
    Link as LinkIcon,
    AlertCircle,
    CheckCircle2,
    XCircle,
    HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { RiskProgress } from "@/components/ui/progress";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn, getSeverityColors } from "@/lib/utils";
import type { AnalysisResult, ThreatIndicator, SeverityLevel } from "@/types";

interface AnalysisResultPanelProps {
    result: AnalysisResult;
}

// Risk contribution categories with visual representation
interface RiskContribution {
    label: string;
    value: number;
    color: string;
    icon: React.ReactNode;
}

// Generate risk contributions from indicators
function generateRiskContributions(indicators: ThreatIndicator[]): RiskContribution[] {
    const categoryMap: Record<string, { total: number; count: number; color: string; icon: React.ReactNode }> = {
        "Urgency language": { total: 0, count: 0, color: "from-red-500 to-orange-500", icon: <AlertTriangle className="h-4 w-4" /> },
        "Suspicious links": { total: 0, count: 0, color: "from-orange-500 to-yellow-500", icon: <LinkIcon className="h-4 w-4" /> },
        "Credential requests": { total: 0, count: 0, color: "from-purple-500 to-pink-500", icon: <Key className="h-4 w-4" /> },
        "Suspicious patterns": { total: 0, count: 0, color: "from-cyan-500 to-blue-500", icon: <BarChart3 className="h-4 w-4" /> },
        "Behavioral signals": { total: 0, count: 0, color: "from-pink-500 to-rose-500", icon: <CircleAlert className="h-4 w-4" /> },
    };

    indicators.forEach(ind => {
        if (ind.type === "keyword") {
            categoryMap["Urgency language"].total += ind.riskContribution;
            categoryMap["Urgency language"].count++;
        } else if (ind.type === "url") {
            categoryMap["Suspicious links"].total += ind.riskContribution;
            categoryMap["Suspicious links"].count++;
        } else if (ind.type === "pattern") {
            if (ind.description.toLowerCase().includes("credential") || ind.description.toLowerCase().includes("password")) {
                categoryMap["Credential requests"].total += ind.riskContribution;
                categoryMap["Credential requests"].count++;
            } else {
                categoryMap["Suspicious patterns"].total += ind.riskContribution;
                categoryMap["Suspicious patterns"].count++;
            }
        } else if (ind.type === "behavioral") {
            categoryMap["Behavioral signals"].total += ind.riskContribution;
            categoryMap["Behavioral signals"].count++;
        }
    });

    return Object.entries(categoryMap)
        .filter(([, data]) => data.count > 0)
        .map(([label, data]) => ({
            label,
            value: Math.min(data.total, 100),
            color: data.color,
            icon: data.icon,
        }))
        .sort((a, b) => b.value - a.value);
}

// False positive likelihood calculation
function getFalsePositiveLikelihood(confidence: number, severity: SeverityLevel): { level: "low" | "medium" | "high"; message: string } {
    if (confidence >= 90 && severity !== "safe") {
        return { level: "low", message: "High model confidence. Very unlikely to be a false positive." };
    } else if (confidence >= 70) {
        return { level: "low", message: "Good confidence level. Low chance of misclassification." };
    } else if (confidence >= 50) {
        return { level: "medium", message: "Moderate confidence. Manual review recommended." };
    } else {
        return { level: "high", message: "Lower confidence. Consider additional verification." };
    }
}

// Threat response actions based on severity and type
interface ThreatAction {
    icon: React.ReactNode;
    title: string;
    description: string;
    priority: "critical" | "high" | "medium" | "low";
    actionLabel?: string;
}

function getThreatActions(severity: SeverityLevel, threatType: string): ThreatAction[] {
    const baseActions: ThreatAction[] = [];

    if (severity === "critical" || severity === "high") {
        baseActions.push({
            icon: <Key className="h-5 w-5" />,
            title: "Change Your Password",
            description: "If you've entered any credentials, change your password immediately on the legitimate website.",
            priority: "critical",
            actionLabel: "Change Now",
        });
        baseActions.push({
            icon: <MousePointerClick className="h-5 w-5" />,
            title: "Do Not Click Any Links",
            description: "Avoid clicking any links in the suspicious content. They may lead to malicious sites.",
            priority: "critical",
        });
    }

    if (severity !== "safe") {
        baseActions.push({
            icon: <Flag className="h-5 w-5" />,
            title: "Report to IT Security",
            description: "Forward this content to your organization's IT security team for investigation.",
            priority: severity === "critical" ? "critical" : "high",
            actionLabel: "Report",
        });
        baseActions.push({
            icon: <Ban className="h-5 w-5" />,
            title: "Block the Sender",
            description: "Block the sender's email address or phone number to prevent future contact.",
            priority: "medium",
            actionLabel: "Block",
        });
    }

    if (threatType.includes("phishing") || threatType.includes("credential")) {
        baseActions.push({
            icon: <RefreshCcw className="h-5 w-5" />,
            title: "Enable 2FA",
            description: "Enable two-factor authentication on your accounts for additional security.",
            priority: "high",
        });
    }

    if (severity === "safe" || severity === "low") {
        baseActions.push({
            icon: <ShieldCheck className="h-5 w-5" />,
            title: "Stay Vigilant",
            description: "While this appears safe, always verify sender authenticity for sensitive requests.",
            priority: "low",
        });
    }

    return baseActions.slice(0, 4); // Max 4 actions
}

export function AnalysisResultPanel({ result }: AnalysisResultPanelProps) {
    const [copied, setCopied] = useState(false);
    const [markedSafe, setMarkedSafe] = useState(false);
    const colors = getSeverityColors(result.severity);
    const riskContributions = generateRiskContributions(result.indicators);
    const falsePositive = getFalsePositiveLikelihood(result.confidence, result.severity);
    const threatActions = getThreatActions(result.severity, result.threatType);

    const copyToClipboard = async () => {
        const summary = `CyberShield AI Analysis Report
---
Threat Type: ${result.threatType.replace("_", " ")}
Risk Score: ${result.riskScore}%
Severity: ${result.severity}
Confidence: ${result.confidence}%
Summary: ${result.summary}
Analyzed: ${new Date(result.analyzedAt).toLocaleString()}
Reference ID: ${result.inputHash}`;

        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMarkSafe = () => {
        setMarkedSafe(true);
        // In production, this would send feedback to the backend
    };

    const severityMessages = {
        critical: "Immediate action required! This content is extremely dangerous.",
        high: "High risk detected. Do not interact with this content.",
        medium: "Moderate risk. Proceed with caution.",
        low: "Low risk, but stay vigilant.",
        safe: "No significant threats detected.",
    };

    const priorityColors = {
        critical: "border-red-500/50 bg-red-500/10 text-red-400",
        high: "border-orange-500/50 bg-orange-500/10 text-orange-400",
        medium: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
        low: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    };

    return (
        <div className="space-y-4">
            {/* Main Result Card */}
            <Card
                variant="elevated"
                className={cn("overflow-hidden border-l-4", colors.border)}
            >
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-lg capitalize">
                                    {result.threatType.replace("_", " ")} Detected
                                </CardTitle>
                                <SeverityBadge severity={result.severity} />
                            </div>
                            <p className="text-sm text-slate-400">
                                Analysis ID: {result.inputHash}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                            {copied ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Risk Score */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-400">
                                Threat Assessment
                            </span>
                            <span className={cn("text-2xl font-bold", colors.text)}>
                                {result.riskScore}%
                            </span>
                        </div>
                        <RiskProgress value={result.riskScore} showLabel={false} />
                        <p className={cn("text-sm", colors.text)}>
                            {severityMessages[result.severity]}
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                        <p className="text-sm leading-relaxed text-slate-300">
                            {result.summary}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 🧠 Enhancement #1: Visual Threat Breakdown */}
            <Card variant="elevated">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                            <BarChart3 className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Risk Contribution Analysis</CardTitle>
                            <CardDescription>Visual breakdown of detected threat factors</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {riskContributions.length > 0 ? (
                        <div className="space-y-4">
                            {riskContributions.map((contribution, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">{contribution.icon}</span>
                                            <span className="font-medium text-white">{contribution.label}</span>
                                        </div>
                                        <span className="font-bold text-white">{contribution.value}%</span>
                                    </div>
                                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
                                        <div
                                            className={cn(
                                                "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out",
                                                contribution.color
                                            )}
                                            style={{ width: `${contribution.value}%` }}
                                        />
                                        {/* Animated shimmer effect */}
                                        <div
                                            className={cn(
                                                "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r opacity-50 animate-pulse",
                                                contribution.color
                                            )}
                                            style={{ width: `${contribution.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <ShieldCheck className="h-10 w-10 text-emerald-400" />
                            <p className="mt-3 text-sm text-slate-400">
                                No significant risk factors detected
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 🔥 Enhancement #2: False Positive Awareness Panel */}
            <Card variant="elevated">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                            <CardTitle className="text-base">AI Confidence Assessment</CardTitle>
                            <CardDescription>Model reliability and false positive awareness</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Confidence Meter */}
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Model Confidence</span>
                            <span className={cn(
                                "text-lg font-bold",
                                result.confidence >= 80 ? "text-emerald-400" :
                                    result.confidence >= 60 ? "text-yellow-400" : "text-orange-400"
                            )}>
                                {result.confidence}%
                            </span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                    result.confidence >= 80 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" :
                                        result.confidence >= 60 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" :
                                            "bg-gradient-to-r from-orange-600 to-orange-400"
                                )}
                                style={{ width: `${result.confidence}%` }}
                            />
                            {/* Confidence markers */}
                            <div className="absolute inset-0 flex justify-between px-1">
                                {[20, 40, 60, 80].map((mark) => (
                                    <div
                                        key={mark}
                                        className="h-full w-px bg-slate-700"
                                        style={{ marginLeft: `${mark - 1}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* False Positive Indicator */}
                    <div className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 transition-all",
                        falsePositive.level === "low" ? "border-emerald-500/30 bg-emerald-500/5" :
                            falsePositive.level === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
                                "border-orange-500/30 bg-orange-500/5"
                    )}>
                        {falsePositive.level === "low" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                        ) : falsePositive.level === "medium" ? (
                            <HelpCircle className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5" />
                        ) : (
                            <XCircle className="h-5 w-5 shrink-0 text-orange-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                    False Positive Likelihood:
                                </span>
                                <span className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                                    falsePositive.level === "low" ? "bg-emerald-500/20 text-emerald-400" :
                                        falsePositive.level === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                                            "bg-orange-500/20 text-orange-400"
                                )}>
                                    {falsePositive.level}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-400">
                                {falsePositive.message}
                            </p>
                        </div>
                    </div>

                    {/* Mark as Safe Button (Feedback Loop) */}
                    {result.severity !== "safe" && !markedSafe && (
                        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                            <div className="flex items-center gap-3">
                                <ThumbsUp className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Is this a false positive?
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Help improve our AI by providing feedback
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkSafe}
                                className="gap-2"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                Mark as Safe
                            </Button>
                        </div>
                    )}

                    {markedSafe && (
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                            <Check className="h-5 w-5 text-emerald-400" />
                            <div>
                                <p className="text-sm font-medium text-emerald-400">
                                    Feedback Recorded
                                </p>
                                <p className="text-xs text-slate-400">
                                    Thank you! Your feedback helps improve threat detection accuracy.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 🔥 Enhancement #3: Threat Response Suggestions */}
            <Card variant="elevated">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                            <ShieldAlert className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Recommended Actions</CardTitle>
                            <CardDescription>
                                What you should do next based on this threat assessment
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {threatActions.map((action, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "group relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-[1.02]",
                                    priorityColors[action.priority]
                                )}
                            >
                                {/* Priority indicator */}
                                <div className={cn(
                                    "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                    action.priority === "critical" ? "bg-red-500/30 text-red-300" :
                                        action.priority === "high" ? "bg-orange-500/30 text-orange-300" :
                                            action.priority === "medium" ? "bg-yellow-500/30 text-yellow-300" :
                                                "bg-emerald-500/30 text-emerald-300"
                                )}>
                                    {action.priority}
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all",
                                        action.priority === "critical" ? "bg-red-500/20" :
                                            action.priority === "high" ? "bg-orange-500/20" :
                                                action.priority === "medium" ? "bg-yellow-500/20" :
                                                    "bg-emerald-500/20"
                                    )}>
                                        {action.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white text-sm">
                                            {action.title}
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                                            {action.description}
                                        </p>
                                        {action.actionLabel && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-7 px-2 text-xs gap-1"
                                            >
                                                {action.actionLabel}
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Explainable AI Panel - Enhanced */}
            <Card variant="elevated">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-cyan-400" />
                        <CardTitle className="text-base">Detailed Threat Explanation</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" defaultValue={["explanation-0"]}>
                        {result.explanation.map((section, index) => (
                            <AccordionItem key={index} value={`explanation-${index}`}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        {section.severity === "critical" || section.severity === "high" ? (
                                            <AlertTriangle className="h-4 w-4 text-red-400" />
                                        ) : section.severity === "medium" ? (
                                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                        ) : (
                                            <Info className="h-4 w-4 text-cyan-400" />
                                        )}
                                        <span>{section.title}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="mb-4 text-slate-400">{section.content}</p>

                                    {section.indicators && section.indicators.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Detected Indicators
                                            </h4>
                                            <div className="space-y-2">
                                                {section.indicators.map((indicator, idx) => (
                                                    <IndicatorItem key={idx} indicator={indicator} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* All Indicators with Visual Enhancement */}
            {result.indicators.length > 0 && (
                <Card variant="elevated">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Suspicious Indicators</CardTitle>
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                                {result.indicators.length} detected
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {result.indicators.map((indicator, index) => (
                                <IndicatorItem key={index} indicator={indicator} showContribution />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Enhanced Indicator Item Component
function IndicatorItem({
    indicator,
    showContribution = false,
}: {
    indicator: ThreatIndicator;
    showContribution?: boolean;
}) {
    const typeIcons = {
        keyword: "🔤",
        url: "🔗",
        pattern: "🔍",
        behavioral: "🎭",
    };

    const typeColors = {
        keyword: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        url: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        pattern: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        behavioral: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    };

    // Highlight suspicious content - wrap in red/orange styling
    const highlightedValue = indicator.type === "url" ? (
        <span className="text-orange-400 bg-orange-500/10 px-1 rounded">{indicator.value}</span>
    ) : indicator.type === "keyword" ? (
        <span className="text-red-400 bg-red-500/10 px-1 rounded font-semibold">{indicator.value}</span>
    ) : (
        <span>{indicator.value}</span>
    );

    return (
        <div className="group flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/30 p-3 transition-all hover:border-slate-600 hover:bg-slate-800/50">
            <span
                className={cn(
                    "shrink-0 rounded-md border px-2 py-1 text-xs font-medium capitalize",
                    typeColors[indicator.type]
                )}
            >
                {typeIcons[indicator.type]} {indicator.type}
            </span>
            <div className="flex-1 min-w-0">
                <code className="block text-sm text-white break-all">
                    {highlightedValue}
                </code>
                <p className="mt-1 text-xs text-slate-500">{indicator.description}</p>
            </div>
            {showContribution && (
                <div className="shrink-0 text-right">
                    <div className="flex items-center gap-2">
                        {/* Mini progress bar */}
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                style={{ width: `${Math.min(indicator.riskContribution * 2.5, 100)}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-orange-400">
                            +{indicator.riskContribution}%
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">risk</p>
                </div>
            )}
        </div>
    );
}
