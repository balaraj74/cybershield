"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
    Mail,
    Link as LinkIcon,
    MessageSquare,
    Shield,
    AlertTriangle,
    CheckCircle,
    Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnalysisResultPanel } from "./components/analysis-result";
import type { AnalysisInputType, AnalysisResult } from "@/types";

interface AnalyzeRequest {
    type: AnalysisInputType;
    content: string;
}

async function analyzeContent(request: AnalyzeRequest): Promise<AnalysisResult> {
    const res = await fetch("/api/proxy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Analysis failed");
    }

    const data = await res.json();
    return data.data;
}

export default function AnalyzePage() {
    const searchParams = useSearchParams();
    const initialType = (searchParams.get("type") as AnalysisInputType) || "email";

    const [inputType, setInputType] = useState<AnalysisInputType>(initialType);
    const [content, setContent] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);

    // Reset result when input type changes
    useEffect(() => {
        setResult(null);
        setContent("");
    }, [inputType]);

    const mutation = useMutation({
        mutationFn: analyzeContent,
        onSuccess: (data) => {
            setResult(data);
            // Clear input after successful analysis (privacy-first)
            setContent("");
        },
    });

    const handleAnalyze = () => {
        if (!content.trim()) return;
        mutation.mutate({ type: inputType, content });
    };

    const placeholders = {
        email: `Paste the suspicious email content here...

Example:
"Dear Customer, Your account has been compromised! Click here immediately to verify your identity: http://suspicious-link.com/verify. Failure to do so within 24 hours will result in permanent account suspension."`,
        url: "https://example.com/suspicious-page",
        message: `Paste the suspicious message here...

Example:
"Congratulations! You've won $1,000,000! Click this link to claim your prize now: bit.ly/claim-prize. Limited time offer!"`,
    };

    const descriptions = {
        email: "Paste email content to detect phishing, social engineering, and credential theft attempts.",
        url: "Enter a URL to scan for malware, phishing pages, and other web-based threats.",
        message: "Paste any suspicious text message to analyze for scams and social engineering tactics.",
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Threat Analysis</h1>
                <p className="mt-1 text-slate-400">
                    Submit content for real-time AI-powered security analysis
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Section */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="text-lg">Analyze Content</CardTitle>
                        <CardDescription>
                            Select the type of content and paste it below for analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Tabs
                            value={inputType}
                            onValueChange={(v) => setInputType(v as AnalysisInputType)}
                        >
                            <TabsList className="w-full">
                                <TabsTrigger value="email" className="flex-1 gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </TabsTrigger>
                                <TabsTrigger value="url" className="flex-1 gap-2">
                                    <LinkIcon className="h-4 w-4" />
                                    URL
                                </TabsTrigger>
                                <TabsTrigger value="message" className="flex-1 gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Message
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="email" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email Content</Label>
                                    <Textarea
                                        placeholder={placeholders.email}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="min-h-[240px]"
                                    />
                                    <p className="text-xs text-slate-500">{descriptions.email}</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>URL to Scan</Label>
                                    <Input
                                        type="url"
                                        placeholder={placeholders.url}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500">{descriptions.url}</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="message" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Message Content</Label>
                                    <Textarea
                                        placeholder={placeholders.message}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="min-h-[240px]"
                                    />
                                    <p className="text-xs text-slate-500">{descriptions.message}</p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleAnalyze}
                            disabled={!content.trim() || mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" />
                                    Analyze for Threats
                                </>
                            )}
                        </Button>

                        {/* Privacy Notice */}
                        <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                            <p className="text-xs text-slate-500">
                                <span className="font-medium text-slate-400">Privacy First: </span>
                                Your input is processed securely and immediately discarded after
                                analysis. We never store raw content - only anonymized threat
                                indicators for your records.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Section */}
                <div className="space-y-4">
                    {mutation.isPending && (
                        <Card variant="elevated" className="min-h-[400px]">
                            <CardContent className="flex h-full min-h-[400px] flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                                    <Shield className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-cyan-400" />
                                </div>
                                <h3 className="mt-6 text-lg font-semibold text-white">
                                    Analyzing Content
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Our AI is scanning for threats...
                                </p>
                                <div className="mt-6 space-y-2 text-center text-xs text-slate-500">
                                    <p>✓ Checking for phishing patterns</p>
                                    <p>✓ Analyzing URL reputation</p>
                                    <p>✓ Detecting social engineering</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {mutation.isError && (
                        <Card variant="elevated">
                            <CardContent className="flex flex-col items-center py-12">
                                <AlertTriangle className="h-12 w-12 text-yellow-400" />
                                <h3 className="mt-4 text-lg font-semibold text-white">
                                    Analysis Failed
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    {mutation.error?.message || "An unexpected error occurred"}
                                </p>
                                <Button className="mt-6" onClick={() => mutation.reset()}>
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {result && <AnalysisResultPanel result={result} />}

                    {!mutation.isPending && !mutation.isError && !result && (
                        <Card variant="elevated" className="min-h-[400px]">
                            <CardContent className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                                    <Shield className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="mt-6 text-lg font-semibold text-white">
                                    Ready to Analyze
                                </h3>
                                <p className="mt-2 max-w-xs text-sm text-slate-400">
                                    Enter suspicious content on the left and click "Analyze for
                                    Threats" to start the security scan.
                                </p>
                                <div className="mt-6 grid grid-cols-3 gap-4 text-xs text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                                        <span>Phishing Detection</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                                        <span>Malware Scanning</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                                        <span>Social Engineering</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
