/**
 * Dark Web Breach Checker - Check if your email is in known data breaches
 */
"use client";

import { useState } from "react";
import { Mail, Shield, AlertTriangle, Check, Loader2, Database, Calendar, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BreachInfo {
    name: string;
    domain: string;
    breachDate: string;
    addedDate: string;
    pwnCount: number;
    description: string;
    dataClasses: string[];
    isVerified: boolean;
    isSensitive: boolean;
}

interface BreachResult {
    email: string;
    breached: boolean;
    breachCount: number;
    breaches: BreachInfo[];
    lastChecked: string;
}

export default function BreachCheckerPage() {
    const [email, setEmail] = useState("");
    const [result, setResult] = useState<BreachResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState("");

    const checkBreaches = async () => {
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setError("");
        setIsChecking(true);

        try {
            const response = await fetch("/api/breach-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch (err) {
            setError("Failed to check breaches. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <Database className="h-7 w-7 text-cyan-400" />
                    Dark Web Breach Checker
                </h1>
                <p className="mt-1 text-slate-400">
                    Check if your email appears in known data breaches • Powered by Have I Been Pwned
                </p>
            </div>

            {/* Search Card */}
            <Card variant="elevated">
                <CardContent className="py-6">
                    <div className="mx-auto max-w-xl space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && checkBreaches()}
                                placeholder="Enter your email address..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>

                        {error && (
                            <p className="text-center text-sm text-red-400">{error}</p>
                        )}

                        <Button
                            onClick={checkBreaches}
                            disabled={!email || isChecking}
                            className="w-full py-6 text-lg"
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Checking breach databases...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-5 w-5" />
                                    Check for Breaches
                                </>
                            )}
                        </Button>

                        <p className="text-center text-xs text-slate-500">
                            <Lock className="mr-1 inline h-3 w-3" />
                            Your email is sent securely and never stored
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <>
                    {/* Status Card */}
                    <Card
                        variant="elevated"
                        className={result.breached ? "border-red-500/50" : "border-emerald-500/50"}
                    >
                        <CardContent className="py-8 text-center">
                            {result.breached ? (
                                <>
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                                        <AlertTriangle className="h-10 w-10 text-red-400" />
                                    </div>
                                    <h2 className="mt-4 text-2xl font-bold text-red-400">
                                        Oh no — breached!
                                    </h2>
                                    <p className="mt-2 text-slate-400">
                                        Your email was found in <span className="font-bold text-white">{result.breachCount}</span> data breaches
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                                        <Check className="h-10 w-10 text-emerald-400" />
                                    </div>
                                    <h2 className="mt-4 text-2xl font-bold text-emerald-400">
                                        Good news — no breaches found!
                                    </h2>
                                    <p className="mt-2 text-slate-400">
                                        Your email wasn't found in any known data breaches
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Breach List */}
                    {result.breached && result.breaches.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                                Breaches containing your email:
                            </h3>
                            {result.breaches.map((breach, index) => (
                                <Card key={index} variant="elevated" className="overflow-hidden">
                                    <div className="flex items-start gap-4 p-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                                            <Globe className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-white">{breach.name}</h4>
                                                {breach.isVerified && (
                                                    <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400">{breach.description}</p>
                                            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Breached: {new Date(breach.breachDate).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Database className="h-3 w-3" />
                                                    {formatNumber(breach.pwnCount)} accounts
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {breach.dataClasses.slice(0, 6).map((dataClass, i) => (
                                                    <span
                                                        key={i}
                                                        className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                                                    >
                                                        {dataClass}
                                                    </span>
                                                ))}
                                                {breach.dataClasses.length > 6 && (
                                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
                                                        +{breach.dataClasses.length - 6} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Recommendations */}
                    {result.breached && (
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-cyan-400" />
                                    Recommended Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-400">1</div>
                                        <div>
                                            <p className="font-medium text-white">Change your password immediately</p>
                                            <p className="text-sm text-slate-400">Update passwords for any accounts using this email</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-400">2</div>
                                        <div>
                                            <p className="font-medium text-white">Enable two-factor authentication</p>
                                            <p className="text-sm text-slate-400">Add an extra layer of security to your accounts</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-400">3</div>
                                        <div>
                                            <p className="font-medium text-white">Use a password manager</p>
                                            <p className="text-sm text-slate-400">Generate unique, strong passwords for each account</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-400">4</div>
                                        <div>
                                            <p className="font-medium text-white">Monitor your accounts</p>
                                            <p className="text-sm text-slate-400">Watch for suspicious activity in emails and bank statements</p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
