/**
 * Password Security Analyzer - AI-powered password strength & breach detection
 */
"use client";

import { useState } from "react";
import { Key, Shield, AlertTriangle, Check, X, Eye, EyeOff, Loader2, Lock, Zap, Clock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordAnalysis {
    score: number;
    strength: "weak" | "fair" | "good" | "strong" | "excellent";
    crackTime: string;
    checks: {
        name: string;
        passed: boolean;
        message: string;
    }[];
    suggestions: string[];
    breached: boolean;
    breachCount?: number;
}

export default function PasswordAnalyzerPage() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzePassword = async () => {
        if (!password) return;
        setIsAnalyzing(true);

        try {
            const response = await fetch("/api/password-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await response.json();
            setAnalysis(data);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case "weak": return "text-red-500";
            case "fair": return "text-orange-500";
            case "good": return "text-yellow-500";
            case "strong": return "text-emerald-500";
            case "excellent": return "text-cyan-400";
            default: return "text-slate-400";
        }
    };

    const getStrengthBg = (strength: string) => {
        switch (strength) {
            case "weak": return "bg-red-500";
            case "fair": return "bg-orange-500";
            case "good": return "bg-yellow-500";
            case "strong": return "bg-emerald-500";
            case "excellent": return "bg-cyan-400";
            default: return "bg-slate-600";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <Key className="h-7 w-7 text-cyan-400" />
                    Password Security Analyzer
                </h1>
                <p className="mt-1 text-slate-400">
                    AI-powered analysis with dark web breach detection
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Card */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-cyan-400" />
                            Test Your Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setAnalysis(null);
                                }}
                                placeholder="Enter a password to analyze..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        <Button
                            onClick={analyzePassword}
                            disabled={!password || isAnalyzing}
                            className="w-full"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Analyze Password Security
                                </>
                            )}
                        </Button>

                        <div className="rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
                            <p className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Your password is analyzed locally and never stored. Only a secure hash is checked against breach databases.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Strength Meter */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-400" />
                            Real-time Strength
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {password ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Password Length</span>
                                    <span className="font-mono text-lg text-white">{password.length} chars</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        {password.length >= 12 ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className={password.length >= 12 ? "text-emerald-400" : "text-red-400"}>
                                            At least 12 characters
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {/[A-Z]/.test(password) ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className={/[A-Z]/.test(password) ? "text-emerald-400" : "text-red-400"}>
                                            Contains uppercase
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {/[a-z]/.test(password) ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className={/[a-z]/.test(password) ? "text-emerald-400" : "text-red-400"}>
                                            Contains lowercase
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {/[0-9]/.test(password) ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className={/[0-9]/.test(password) ? "text-emerald-400" : "text-red-400"}>
                                            Contains numbers
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        {/[^A-Za-z0-9]/.test(password) ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-400" : "text-red-400"}>
                                            Contains special characters
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-500">
                                <Key className="mx-auto h-12 w-12 opacity-50" />
                                <p className="mt-2">Enter a password to see real-time analysis</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Score Card */}
                    <Card variant="elevated">
                        <CardContent className="py-6 text-center">
                            <div className={`text-6xl font-bold ${getStrengthColor(analysis.strength)}`}>
                                {analysis.score}
                            </div>
                            <div className={`mt-2 text-xl font-semibold uppercase ${getStrengthColor(analysis.strength)}`}>
                                {analysis.strength}
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className={`h-full transition-all duration-500 ${getStrengthBg(analysis.strength)}`}
                                    style={{ width: `${analysis.score}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Crack Time */}
                    <Card variant="elevated">
                        <CardContent className="flex h-full flex-col items-center justify-center py-6 text-center">
                            <Clock className="h-10 w-10 text-cyan-400" />
                            <div className="mt-2 text-sm text-slate-400">Time to crack</div>
                            <div className="mt-1 text-2xl font-bold text-white">{analysis.crackTime}</div>
                        </CardContent>
                    </Card>

                    {/* Breach Status */}
                    <Card variant={analysis.breached ? "elevated" : "elevated"} className={analysis.breached ? "border-red-500/50" : "border-emerald-500/50"}>
                        <CardContent className="flex h-full flex-col items-center justify-center py-6 text-center">
                            <Database className={`h-10 w-10 ${analysis.breached ? "text-red-400" : "text-emerald-400"}`} />
                            <div className="mt-2 text-sm text-slate-400">Dark Web Status</div>
                            {analysis.breached ? (
                                <>
                                    <div className="mt-1 text-xl font-bold text-red-400">BREACHED</div>
                                    <div className="text-sm text-red-300">Found in {analysis.breachCount} breaches</div>
                                </>
                            ) : (
                                <div className="mt-1 text-xl font-bold text-emerald-400">NOT FOUND</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Suggestions */}
            {analysis && analysis.suggestions.length > 0 && (
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            Improvement Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {analysis.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
