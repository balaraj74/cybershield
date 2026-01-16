/**
 * AI Security Chatbot - Chat with Gemini about cybersecurity
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Shield, Loader2, Sparkles, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
    "How can I protect myself from phishing attacks?",
    "What makes a strong password?",
    "How do I know if my email is compromised?",
    "What is ransomware and how to prevent it?",
    "Explain two-factor authentication",
    "How to secure my home WiFi network?",
];

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 Hello! I'm CyberShield AI, your personal cybersecurity assistant powered by Google Gemini. Ask me anything about:\n\n• **Threat Protection** - Phishing, malware, ransomware\n• **Password Security** - Strong passwords, managers\n• **Privacy Tips** - Data protection, encryption\n• **Incident Response** - What to do if hacked\n\nHow can I help you stay secure today?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage: Message = {
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                role: "assistant",
                content: data.response || "I apologize, but I couldn't process your request. Please try again.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "⚠️ Connection error. Please check your internet and try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <Bot className="h-7 w-7 text-cyan-400" />
                        AI Security Assistant
                    </h1>
                    <p className="mt-1 text-slate-400">
                        Powered by Google Gemini 2.5 Flash • Ask anything about cybersecurity
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                    AI Powered
                </div>
            </div>

            {/* Chat Container */}
            <Card variant="elevated" className="flex flex-1 flex-col overflow-hidden">
                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === "user"
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "bg-gradient-to-br from-cyan-500 to-purple-500 text-white"
                                    }`}
                            >
                                {message.role === "user" ? (
                                    <User className="h-4 w-4" />
                                ) : (
                                    <Shield className="h-4 w-4" />
                                )}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                                        ? "bg-cyan-500/20 text-white"
                                        : "bg-slate-800/80 text-slate-200"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: message.content
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-400">$1</strong>')
                                            .replace(/\n/g, '<br/>')
                                    }}
                                />
                                <div className="mt-1 text-xs text-slate-500">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 text-white">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-4 py-3 text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyzing your question...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Suggested Questions */}
                {messages.length <= 2 && (
                    <div className="border-t border-slate-800 p-4">
                        <p className="mb-2 text-xs text-slate-500">Suggested questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_QUESTIONS.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => sendMessage(question)}
                                    className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-slate-800 p-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Ask about cybersecurity, privacy, or threats..."
                            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="rounded-xl px-4"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Your conversations are not stored
                        </div>
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            AI can make mistakes
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
