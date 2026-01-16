/**
 * Security Score Calculator - Assess your digital security posture
 */
"use client";

import { useState } from "react";
import { Shield, Check, X, ChevronRight, Trophy, Lock, Smartphone, Key, Mail, Globe, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
    id: string;
    category: string;
    question: string;
    icon: React.ElementType;
    points: number;
}

const QUESTIONS: Question[] = [
    { id: "password_manager", category: "Passwords", question: "Do you use a password manager?", icon: Key, points: 15 },
    { id: "unique_passwords", category: "Passwords", question: "Do you use unique passwords for each account?", icon: Key, points: 10 },
    { id: "password_length", category: "Passwords", question: "Are your passwords at least 12 characters long?", icon: Key, points: 10 },
    { id: "2fa_enabled", category: "Authentication", question: "Do you have 2FA enabled on important accounts?", icon: Smartphone, points: 15 },
    { id: "2fa_email", category: "Authentication", question: "Is 2FA enabled on your primary email?", icon: Mail, points: 10 },
    { id: "phishing_aware", category: "Awareness", question: "Can you identify phishing emails?", icon: Mail, points: 5 },
    { id: "software_updates", category: "Devices", question: "Do you keep your software and OS updated?", icon: Globe, points: 10 },
    { id: "antivirus", category: "Devices", question: "Do you use antivirus/security software?", icon: Shield, points: 5 },
    { id: "backup", category: "Data", question: "Do you regularly backup important data?", icon: Lock, points: 10 },
    { id: "public_wifi", category: "Network", question: "Do you avoid sensitive activities on public WiFi?", icon: Globe, points: 5 },
    { id: "vpn", category: "Network", question: "Do you use a VPN when on public networks?", icon: Lock, points: 5 },
];

interface ScoreResult {
    score: number;
    grade: string;
    level: string;
    color: string;
    improvements: string[];
    strengths: string[];
}

export default function SecurityScorePage() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});
    const [showResults, setShowResults] = useState(false);
    const [started, setStarted] = useState(false);

    const handleAnswer = (answer: boolean) => {
        const question = QUESTIONS[currentQuestion];
        setAnswers({ ...answers, [question.id]: answer });

        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    const calculateScore = (): ScoreResult => {
        let score = 0;
        const improvements: string[] = [];
        const strengths: string[] = [];

        QUESTIONS.forEach((q) => {
            if (answers[q.id]) {
                score += q.points;
                strengths.push(q.question.replace("Do you ", "You ").replace("?", ""));
            } else {
                improvements.push(getImprovement(q.id));
            }
        });

        let grade: string;
        let level: string;
        let color: string;

        if (score >= 90) { grade = "A+"; level = "Excellent"; color = "text-emerald-400"; }
        else if (score >= 80) { grade = "A"; level = "Very Good"; color = "text-emerald-400"; }
        else if (score >= 70) { grade = "B"; level = "Good"; color = "text-cyan-400"; }
        else if (score >= 60) { grade = "C"; level = "Fair"; color = "text-yellow-400"; }
        else if (score >= 50) { grade = "D"; level = "Poor"; color = "text-orange-400"; }
        else { grade = "F"; level = "Critical"; color = "text-red-400"; }

        return { score, grade, level, color, improvements, strengths };
    };

    const getImprovement = (id: string): string => {
        const improvements: Record<string, string> = {
            password_manager: "Start using a password manager like Bitwarden or 1Password",
            unique_passwords: "Generate unique passwords for each account",
            password_length: "Update passwords to be at least 12 characters",
            "2fa_enabled": "Enable two-factor authentication on all important accounts",
            "2fa_email": "Protect your email with 2FA - it's the key to all your accounts",
            phishing_aware: "Learn to identify phishing attempts - check sender addresses and hover over links",
            software_updates: "Enable automatic updates for your OS and apps",
            antivirus: "Install reputable security software on your devices",
            backup: "Set up automatic backups to cloud or external drive",
            public_wifi: "Avoid banking or shopping on public WiFi networks",
            vpn: "Use a reputable VPN service when on untrusted networks",
        };
        return improvements[id] || "Improve your security practices";
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setStarted(false);
    };

    const progress = ((currentQuestion + (showResults ? 1 : 0)) / QUESTIONS.length) * 100;

    if (!started) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <Trophy className="h-7 w-7 text-cyan-400" />
                        Security Score Calculator
                    </h1>
                    <p className="mt-1 text-slate-400">
                        Assess your digital security posture with our interactive quiz
                    </p>
                </div>

                <Card variant="elevated" className="overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 p-8 text-center">
                        <Shield className="mx-auto h-20 w-20 text-cyan-400" />
                        <h2 className="mt-4 text-2xl font-bold text-white">How Secure Are You?</h2>
                        <p className="mx-auto mt-2 max-w-md text-slate-400">
                            Answer {QUESTIONS.length} quick questions to get your personalized security score and recommendations
                        </p>
                        <Button onClick={() => setStarted(true)} className="mt-6 px-8 py-6 text-lg">
                            Start Assessment
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card variant="elevated">
                        <CardContent className="py-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
                                <Shield className="h-6 w-6 text-cyan-400" />
                            </div>
                            <h3 className="mt-3 font-semibold text-white">Privacy Focused</h3>
                            <p className="mt-1 text-sm text-slate-400">Your answers are never stored</p>
                        </CardContent>
                    </Card>
                    <Card variant="elevated">
                        <CardContent className="py-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                                <Check className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h3 className="mt-3 font-semibold text-white">Personalized Tips</h3>
                            <p className="mt-1 text-sm text-slate-400">Get actionable improvements</p>
                        </CardContent>
                    </Card>
                    <Card variant="elevated">
                        <CardContent className="py-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                                <Trophy className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="mt-3 font-semibold text-white">Track Progress</h3>
                            <p className="mt-1 text-sm text-slate-400">Retake anytime to measure improvement</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (showResults) {
        const result = calculateScore();
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <Trophy className="h-7 w-7 text-cyan-400" />
                        Your Security Score
                    </h1>
                </div>

                {/* Score Card */}
                <Card variant="elevated" className="overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-center">
                        <div className="relative mx-auto h-40 w-40">
                            <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 100 100">
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-slate-700"
                                />
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${result.score * 2.83} 283`}
                                    className={result.color}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-bold ${result.color}`}>{result.score}</span>
                                <span className="text-sm text-slate-400">/ 100</span>
                            </div>
                        </div>
                        <div className={`mt-4 text-3xl font-bold ${result.color}`}>
                            Grade: {result.grade}
                        </div>
                        <div className="mt-1 text-slate-400">{result.level} Security Posture</div>
                    </div>
                </Card>

                {/* Improvements */}
                {result.improvements.length > 0 && (
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-400">
                                <AlertTriangle className="h-5 w-5" />
                                Areas to Improve ({result.improvements.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {result.improvements.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-xs text-yellow-400">
                                            {index + 1}
                                        </div>
                                        <span className="text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Strengths */}
                {result.strengths.length > 0 && (
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-400">
                                <Check className="h-5 w-5" />
                                Your Strengths ({result.strengths.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.strengths.map((item, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm text-emerald-300">
                                        <Check className="h-4 w-4 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Button onClick={resetQuiz} className="w-full">
                    Retake Assessment
                </Button>
            </div>
        );
    }

    const question = QUESTIONS[currentQuestion];
    const Icon = question.icon;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <Trophy className="h-7 w-7 text-cyan-400" />
                    Security Score Calculator
                </h1>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                    <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
                    <span>{question.category}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <Card variant="elevated">
                <CardContent className="py-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
                        <Icon className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-white">
                        {question.question}
                    </h2>
                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            onClick={() => handleAnswer(true)}
                            className="min-w-[120px] bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Check className="mr-2 h-5 w-5" />
                            Yes
                        </Button>
                        <Button
                            onClick={() => handleAnswer(false)}
                            variant="outline"
                            className="min-w-[120px] border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                            <X className="mr-2 h-5 w-5" />
                            No
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
