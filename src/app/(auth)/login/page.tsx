"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, ShieldCheck, Eye, EyeOff, AlertCircle, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/alerts/alert";
import { useAuth } from "@/lib/supabase/auth-provider";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const { signIn, signInWithGoogle, signInWithGithub } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { error } = await signIn(email, password);

            if (error) {
                setError(error.message || "Invalid email or password. Please try again.");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch {
            setError("Failed to sign in with Google.");
            setIsLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGithub();
        } catch {
            setError("Failed to sign in with GitHub.");
            setIsLoading(false);
        }
    };

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
                        <CardTitle className="text-xl">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to access your security dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* OAuth Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <Button
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Google
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleGithubSignIn}
                                disabled={isLoading}
                                className="w-full"
                            >
                                <Github className="h-4 w-4 mr-2" />
                                GitHub
                            </Button>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900 px-2 text-slate-500">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

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
                                        autoComplete="current-password"
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
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                loading={isLoading}
                            >
                                Sign In
                            </Button>
                        </form>

                        {/* Sign Up Link */}
                        <div className="mt-6 text-center text-sm text-slate-400">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="text-cyan-400 hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Protected by Supabase Auth.{" "}
                    <Link href="/privacy" className="text-cyan-400 hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
}
