"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/alerts/alert";
import { useAuth } from "@/lib/supabase/auth-provider";

export default function SignUpPage() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await signUp(email, password, name);

            if (error) {
                setError(error.message || "Failed to create account. Please try again.");
            } else {
                setSuccess(true);
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />

                <Card variant="glass" className="max-w-md w-full border-slate-700/50">
                    <CardContent className="pt-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Check your email!</h2>
                        <p className="text-slate-400 mb-6">
                            We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>.
                            Click the link to activate your account.
                        </p>
                        <Button onClick={() => router.push("/login")} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            {/* Background effects */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
            <div className="fixed -left-40 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="fixed -right-40 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="relative">
                            <Shield className="h-12 w-12 text-cyan-400" />
                            <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
                                CyberShield
                            </span>
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                AI Security Platform
                            </span>
                        </div>
                    </Link>
                </div>

                <Card variant="glass" className="border-slate-700/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Create Account</CardTitle>
                        <CardDescription>
                            Start protecting your digital assets today
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Must be at least 8 characters
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                loading={isLoading}
                            >
                                Create Account
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center text-sm text-slate-400">
                            Already have an account?{" "}
                            <Link href="/login" className="text-cyan-400 hover:underline font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-sm text-slate-500">
                    By signing up, you agree to our{" "}
                    <Link href="/privacy" className="text-cyan-400 hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
}
