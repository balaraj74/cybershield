"use client";

import {
    Shield,
    Cpu,
    Monitor,
    BarChart3,
    ArrowRight,
    Zap,
    Eye,
    Network,
    Bug,
    EyeOff,
    Gauge,
    Fish,
    UserX,
    ClipboardCheck,
    Link2,
    MessageSquare,
    Key,
    Database,
    FileText,
    Trophy,
    Server,
    Code,
    Terminal,
    ChevronRight,
    BookOpen,
    Layers,
    Globe,
    Lock,
    Search,
    Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

/* ─── Smooth scroll helper ─── */
function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Section Heading ─── */
function SectionHeading({ id, icon: Icon, title, subtitle }: {
    id: string;
    icon: React.ElementType;
    title: string;
    subtitle: string;
}) {
    return (
        <div id={id} className="scroll-mt-24 mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                    <Icon className="h-5 w-5 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            <p className="text-neutral-400 ml-[52px]">{subtitle}</p>
        </div>
    );
}

/* ─── Code Block ─── */
function CodeBlock({ title, lang, children }: { title?: string; lang?: string; children: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="rounded-xl border border-neutral-800/40 overflow-hidden">
            {title && (
                <div className="flex items-center justify-between bg-neutral-900/80 border-b border-neutral-800/40 px-4 py-2">
                    <span className="text-xs font-medium text-neutral-400">{title}</span>
                    <button onClick={copy} className="text-[11px] text-neutral-500 hover:text-orange-400 transition-colors">
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            )}
            <pre className="bg-neutral-950/60 p-4 overflow-x-auto text-[13px] leading-relaxed text-neutral-300 font-mono">
                <code>{children}</code>
            </pre>
        </div>
    );
}

/* ─── API Table ─── */
function ApiTable({ rows }: { rows: { method: string; endpoint: string; description: string }[] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-neutral-800/40">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-neutral-800/40 bg-neutral-900/50">
                        <th className="px-4 py-3 text-left font-semibold text-neutral-300 w-20">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-300">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-300">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-neutral-800/20 last:border-0 hover:bg-neutral-800/20 transition-colors">
                            <td className="px-4 py-3">
                                <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${row.method === "GET"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : row.method === "POST"
                                        ? "bg-blue-500/15 text-blue-400"
                                        : row.method === "PUT"
                                            ? "bg-amber-500/15 text-amber-400"
                                            : "bg-red-500/15 text-red-400"
                                    }`}>
                                    {row.method}
                                </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[13px] text-orange-300/90">{row.endpoint}</td>
                            <td className="px-4 py-3 text-neutral-400">{row.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─── Navigation Items ─── */
const navSections = [
    { id: "architecture", label: "Architecture" },
    { id: "how-it-works", label: "How It Works" },
    { id: "ai-modules", label: "AI Modules" },
    { id: "security-tools", label: "Security Tools" },
    { id: "api-reference", label: "API Reference" },
    { id: "tech-stack", label: "Tech Stack" },
    { id: "getting-started", label: "Getting Started" },
    { id: "environment", label: "Environment" },
];

/* ─── Module Data ─── */
const modules = [
    {
        icon: Monitor, title: "Endpoint Protection", badge: "Module 1",
        description: "Lightweight Python agent monitors processes, files, and network activity with Isolation Forest ML anomaly detection.",
        techniques: ["7-dim feature vectors", "Isolation Forest (n=200)", "Heuristic fallback", "Auto-retraining"],
    },
    {
        icon: Bug, title: "Behavior Malware Detection", badge: "Module 2",
        description: "Detects ransomware, cryptominers, keyloggers, trojans, fileless attacks, and persistence mechanisms by behavior.",
        techniques: ["Encryption pattern analysis", "CPU/IO profiling", "DLL hook detection", "Process injection signatures"],
    },
    {
        icon: Network, title: "Network IDS", badge: "Module 3",
        description: "Network-level intrusion detection using entropy analysis, beaconing detection, DGA identification, and port scan detection.",
        techniques: ["Shannon entropy (H > 4.0)", "Time-series beaconing (σ < 5s)", "DGA consonant ratio", "Volume anomaly detection"],
    },
    {
        icon: Zap, title: "Autonomous Response", badge: "Module 4",
        description: "Automated threat containment: remote process kill, device isolation, IP blocking, with full rollback support.",
        techniques: ["Remote kill", "Device isolation", "IP blocklist", "Reversible audit trail"],
    },
    {
        icon: EyeOff, title: "Privacy-Preserving AI", badge: "Module 5",
        description: "Ensures data processing follows privacy-first principles: PII scrubbing, differential privacy, and anonymization.",
        techniques: ["PII regex scrubbing", "Laplacian noise (ε=1.0)", "SHA-256 hashing", "Transparency logging"],
    },
    {
        icon: Gauge, title: "Dynamic Risk Scoring", badge: "Module 6",
        description: "Computes a 0–100 risk score across device health, threat exposure, network security, user behavior, and compliance.",
        techniques: ["Weighted categories (5×)", "Color-coded severity", "Trend tracking", "Per-device scores"],
    },
    {
        icon: Fish, title: "Phishing Detection", badge: "Module 7",
        description: "Multi-signal phishing detection via URL analysis, typosquatting, homoglyph detection, email NLP, and brand impersonation.",
        techniques: ["Levenshtein distance", "Cyrillic homoglyphs", "Urgency NLP", "15+ brand fingerprints"],
    },
    {
        icon: UserX, title: "Insider Threat Detection", badge: "Module 8",
        description: "User behavior analytics: baseline profiling, after-hours detection, bulk access alerts, USB exfiltration monitoring.",
        techniques: ["Baseline learning", "After-hours flags", "3× download threshold", "Privilege escalation"],
    },
    {
        icon: ClipboardCheck, title: "Compliance Automation", badge: "Module 9",
        description: "Automated compliance checking against ISO 27001, GDPR, Indian IT Act, and SOC 2 frameworks — with remediation guidance.",
        techniques: ["15+ ISO controls", "10 GDPR articles", "IT Act §43/66/72A", "SOC 2 Trust Criteria"],
    },
];

/* ─── Tools Data ─── */
const tools = [
    { icon: Search, title: "AI Threat Analysis", description: "Paste any email, URL, or message — get instant AI-powered threat classification with confidence scores." },
    { icon: Link2, title: "URL Scanner", description: "Deep URL analysis with domain reputation, SSL check, typosquatting detection, and visual similarity scoring." },
    { icon: MessageSquare, title: "SMS/Message Checker", description: "Detect social engineering and smishing attempts in text messages using NLP pattern matching." },
    { icon: Key, title: "Password Strength", description: "Entropy analysis + breach database lookup — check if your password has appeared in known data breaches." },
    { icon: Database, title: "Breach Checker", description: "Check if email addresses appear in known data breach databases with detailed exposure reports." },
    { icon: FileText, title: "Privacy Analyzer", description: "Analyze privacy policies and data collection practices of websites with automated risk scoring." },
];

/* ─── Pipeline Steps ─── */
const pipelineSteps = [
    {
        step: "01", title: "Collect", icon: Monitor, color: "from-blue-500/20 to-blue-600/5",
        description: "The lightweight Python agent scans processes (CPU, memory, threads, connections), watches file system events, and monitors network activity every 30 seconds.",
    },
    {
        step: "02", title: "Analyze", icon: Cpu, color: "from-purple-500/20 to-purple-600/5",
        description: "FastAPI backend runs NLP + ML engines in-memory: feature extraction converts process data to 7-dimensional vectors, Isolation Forest scores anomalies.",
    },
    {
        step: "03", title: "Detect", icon: Eye, color: "from-orange-500/20 to-orange-600/5",
        description: "Pattern matching flags anomalies with confidence scores (0.0–1.0). Each detection gets severity, threat type, explanation, and recommended action.",
    },
    {
        step: "04", title: "Respond", icon: Zap, color: "from-red-500/20 to-red-600/5",
        description: "Autonomous response system can kill processes, isolate devices, block IPs, and alert operators — all with reversible audit trail.",
    },
];

/* ─────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ───────────────────────────────────────────────────────── */
export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id);
                }
            },
            { rootMargin: "-20% 0px -70% 0px" }
        );
        navSections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="relative">
            {/* ── Sticky Side Nav (desktop) ── */}
            <nav className="hidden xl:block fixed right-6 top-1/2 -translate-y-1/2 z-40">
                <div className="glass-panel rounded-2xl p-3 space-y-1">
                    {navSections.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => scrollTo(id)}
                            className={`flex items-center gap-2 w-full rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${activeSection === id
                                ? "bg-orange-500/15 text-orange-400"
                                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40"
                                }`}
                        >
                            <ChevronRight className={`h-3 w-3 transition-transform ${activeSection === id ? "rotate-90 text-orange-400" : ""}`} />
                            {label}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="max-w-5xl mx-auto space-y-16 pb-24">

                {/* ════════════════════════════════════════════════
                    HERO
                   ════════════════════════════════════════════════ */}
                <section className="text-center pt-8 pb-4 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 mb-6">
                        <BookOpen className="h-4 w-4 text-orange-400" />
                        <span className="text-xs font-medium text-orange-300">Documentation & API Reference</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        <span className="text-gradient">CyberShield AI</span>
                        <span className="text-white"> Docs</span>
                    </h1>
                    <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                        Complete documentation for the AI-powered cybersecurity platform — architecture, 9 AI modules,
                        full API reference, and deployment guides.
                    </p>

                    {/* Quick nav pills */}
                    <div className="flex flex-wrap justify-center gap-2 mt-8">
                        {navSections.map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => scrollTo(id)}
                                className="rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-orange-300 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    ARCHITECTURE OVERVIEW
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="architecture"
                        icon={Layers}
                        title="Architecture Overview"
                        subtitle="Three core pillars power the CyberShield platform."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            {
                                icon: Cpu, title: "9 AI Security Modules",
                                items: ["NLP threat classification", "Isolation Forest anomaly detection", "Network intrusion detection", "Compliance automation"],
                                gradient: "from-purple-500/10 to-transparent",
                            },
                            {
                                icon: Monitor, title: "Endpoint Protection Agent",
                                items: ["Process monitoring (psutil)", "File system watcher (inotify)", "Network connection analysis", "Remote command execution"],
                                gradient: "from-blue-500/10 to-transparent",
                            },
                            {
                                icon: BarChart3, title: "Security Operations Dashboard",
                                items: ["Live threat feed & charts", "Glassmorphic dark-theme UI", "One-click response actions", "Compliance reporting"],
                                gradient: "from-orange-500/10 to-transparent",
                            },
                        ].map((pillar) => (
                            <Card key={pillar.title} variant="elevated" className="group hover:border-neutral-700/50 transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pillar.gradient} mb-4`}>
                                        <pillar.icon className="h-6 w-6 text-neutral-200" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-3">{pillar.title}</h3>
                                    <ul className="space-y-2">
                                        {pillar.items.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-sm text-neutral-400">
                                                <ChevronRight className="h-4 w-4 text-orange-500/60 mt-0.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Data Flow Diagram */}
                    <Card variant="elevated" className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Data Flow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                {[
                                    { label: "Endpoint Agent", sub: "Collect process, file & network data", icon: Monitor },
                                    { label: "Next.js API Proxy", sub: "Route & authenticate requests", icon: Globe },
                                    { label: "FastAPI Backend", sub: "In-memory AI analysis (NLP + ML)", icon: Server },
                                    { label: "Supabase DB", sub: "Store anonymized results only", icon: Lock },
                                ].map((step, i) => (
                                    <div key={step.label} className="flex flex-col items-center text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800/60 border border-neutral-700/30 mb-3">
                                            <step.icon className="h-6 w-6 text-orange-400" />
                                        </div>
                                        <span className="text-sm font-semibold text-white">{step.label}</span>
                                        <span className="text-xs text-neutral-500 mt-1">{step.sub}</span>
                                        {i < 3 && (
                                            <ArrowRight className="h-4 w-4 text-neutral-600 mt-3 hidden md:block rotate-0 md:absolute md:relative" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* ════════════════════════════════════════════════
                    HOW IT WORKS
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="how-it-works"
                        icon={Zap}
                        title="How It Works"
                        subtitle="The end-to-end detection pipeline in four steps."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {pipelineSteps.map((s) => (
                            <Card key={s.step} variant="elevated" className="group hover:border-neutral-700/50 transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}>
                                            <s.icon className="h-6 w-6 text-neutral-200" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-orange-500/70 uppercase tracking-widest">Step {s.step}</div>
                                            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-400 leading-relaxed">{s.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Privacy Note */}
                    <Card variant="elevated" className="mt-5 border-orange-500/10">
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 shrink-0">
                                <Lock className="h-5 w-5 text-orange-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-1">Privacy by Architecture</h4>
                                <p className="text-sm text-neutral-400">
                                    Raw content is processed ephemerally in memory. Only anonymized results (SHA-256 hashes + metadata) are persisted.
                                    Even if the database is breached, no sensitive content can be recovered.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* ════════════════════════════════════════════════
                    AI MODULES
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="ai-modules"
                        icon={Cpu}
                        title="AI Modules Deep Dive"
                        subtitle="9 specialized AI security modules, each with its own detection engine."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {modules.map((mod) => (
                            <Card key={mod.title} variant="elevated" className="group hover:border-neutral-700/50 transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                                                <mod.icon className="h-[18px] w-[18px] text-orange-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-white">{mod.title}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{mod.badge}</span>
                                    </div>
                                    <p className="text-[13px] text-neutral-400 mb-4 leading-relaxed">{mod.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {mod.techniques.map((t) => (
                                            <span key={t} className="rounded-full bg-neutral-800/80 px-2.5 py-0.5 text-[11px] text-neutral-400 border border-neutral-700/30">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    SECURITY TOOLS
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="security-tools"
                        icon={Shield}
                        title="Built-in Security Tools"
                        subtitle="6 ready-to-use tools accessible from the dashboard."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tools.map((tool) => (
                            <Card key={tool.title} variant="elevated" className="hover:border-neutral-700/50 transition-all duration-300">
                                <CardContent className="p-5 flex items-start gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800/60 shrink-0">
                                        <tool.icon className="h-[18px] w-[18px] text-neutral-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white mb-1">{tool.title}</h3>
                                        <p className="text-[13px] text-neutral-500 leading-relaxed">{tool.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    API REFERENCE
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="api-reference"
                        icon={Code}
                        title="API Reference"
                        subtitle="Complete REST API documentation. Base URL: http://localhost:8001"
                    />

                    {/* Base URLs */}
                    <Card variant="elevated" className="mb-6">
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: "Backend API", url: "http://localhost:8001" },
                                    { label: "Frontend", url: "http://localhost:3000" },
                                    { label: "Swagger Docs", url: "http://localhost:8001/docs" },
                                ].map((u) => (
                                    <div key={u.label} className="flex items-center gap-3 rounded-lg bg-neutral-900/50 border border-neutral-800/30 p-3">
                                        <Globe className="h-4 w-4 text-orange-400 shrink-0" />
                                        <div>
                                            <div className="text-xs text-neutral-500">{u.label}</div>
                                            <div className="text-sm font-mono text-neutral-300">{u.url}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Core APIs */}
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Server className="h-4 w-4 text-orange-400" />
                        Core Endpoints
                    </h3>
                    <ApiTable rows={[
                        { method: "GET", endpoint: "/health", description: "Health check with system status" },
                        { method: "POST", endpoint: "/api/v1/analyze", description: "Analyze content for threats (privacy-first)" },
                        { method: "GET", endpoint: "/api/v1/dashboard/stats", description: "Dashboard statistics + charts" },
                        { method: "GET", endpoint: "/api/v1/dashboard/metrics", description: "KPI metrics (threats, alerts, last scan)" },
                        { method: "GET", endpoint: "/api/v1/dashboard/trends", description: "Historical trend data (1–30 days)" },
                        { method: "GET", endpoint: "/api/v1/history", description: "Paginated analysis history with filters" },
                        { method: "GET", endpoint: "/api/v1/history/{id}", description: "Detailed analysis result by ID" },
                        { method: "POST", endpoint: "/api/v1/feedback", description: "Report false positives/negatives" },
                    ]} />

                    {/* Endpoint Agent APIs */}
                    <h3 className="text-lg font-semibold text-white mb-3 mt-8 flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-orange-400" />
                        Endpoint Agent API
                    </h3>
                    <ApiTable rows={[
                        { method: "POST", endpoint: "/api/v1/endpoint/register", description: "Register new endpoint device" },
                        { method: "POST", endpoint: "/api/v1/endpoint/report", description: "Submit agent behavior report + AI analysis" },
                        { method: "GET", endpoint: "/api/v1/endpoint/commands/{device_id}", description: "Poll for pending commands" },
                        { method: "POST", endpoint: "/api/v1/endpoint/commands/{device_id}/result", description: "Report command execution result" },
                        { method: "GET", endpoint: "/api/v1/endpoint/dashboard", description: "Endpoint dashboard statistics" },
                        { method: "GET", endpoint: "/api/v1/endpoint/devices", description: "List all registered devices" },
                        { method: "POST", endpoint: "/api/v1/endpoint/kill-process", description: "Remote process termination" },
                    ]} />

                    {/* Security Module APIs */}
                    <h3 className="text-lg font-semibold text-white mb-3 mt-8 flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-orange-400" />
                        Security Module Endpoints
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-neutral-800/40">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-800/40 bg-neutral-900/50">
                                    <th className="px-4 py-3 text-left font-semibold text-neutral-300">Module</th>
                                    <th className="px-4 py-3 text-left font-semibold text-neutral-300">Prefix</th>
                                    <th className="px-4 py-3 text-left font-semibold text-neutral-300">Key Endpoints</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { module: "Overview", prefix: "/api/v1/modules/overview", endpoints: "All module statuses" },
                                    { module: "Behavior Malware", prefix: "/api/v1/modules/behavior-malware", endpoints: "/stats, /alerts" },
                                    { module: "Network IDS", prefix: "/api/v1/modules/network-ids", endpoints: "/stats, /alerts" },
                                    { module: "Autonomous Response", prefix: "/api/v1/modules/autonomous-response", endpoints: "/stats, /isolate/{id}, /block-ip" },
                                    { module: "Privacy AI", prefix: "/api/v1/modules/privacy", endpoints: "/report, /transparency-log, /policy" },
                                    { module: "Risk Score", prefix: "/api/v1/modules/risk", endpoints: "/summary, /devices, /devices/{id}" },
                                    { module: "Phishing", prefix: "/api/v1/modules/phishing", endpoints: "/analyze-url, /analyze-email, /stats" },
                                    { module: "Insider Threat", prefix: "/api/v1/modules/insider-threat", endpoints: "/stats, /alerts, /profiles" },
                                    { module: "Compliance", prefix: "/api/v1/modules/compliance", endpoints: "/summary, /frameworks/{name}, /checks" },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-neutral-800/20 last:border-0 hover:bg-neutral-800/20 transition-colors">
                                        <td className="px-4 py-3 text-neutral-300 font-medium">{row.module}</td>
                                        <td className="px-4 py-3 font-mono text-[13px] text-orange-300/90">{row.prefix}</td>
                                        <td className="px-4 py-3 text-neutral-400 font-mono text-[13px]">{row.endpoints}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Example Request / Response */}
                    <h3 className="text-lg font-semibold text-white mb-3 mt-8 flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-orange-400" />
                        Example: Analyze Content
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CodeBlock title="Request" lang="bash">
                            {`curl -X POST http://localhost:8001/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: cybershield-api-key-2024" \\
  -d '{
    "content": "Click here to verify your account: http://evil-site.com/login",
    "input_type": "email"
  }'`}
                        </CodeBlock>
                        <CodeBlock title="Response" lang="json">
                            {`{
  "status": "success",
  "data": {
    "threat_type": "phishing",
    "risk_score": 94,
    "severity": "critical",
    "confidence": 0.92,
    "indicators": [
      "suspicious_url",
      "urgency_language",
      "credential_request"
    ],
    "suggestions": [
      "Do not click the link",
      "Report to IT security"
    ]
  }
}`}
                        </CodeBlock>
                    </div>

                    {/* Example: Agent Report */}
                    <h3 className="text-lg font-semibold text-white mb-3 mt-8 flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-orange-400" />
                        Example: Agent Behavior Report
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CodeBlock title="Request — POST /api/v1/endpoint/report" lang="json">
                            {`{
  "device_id": "abc-123",
  "hostname": "workstation-01",
  "process_behaviors": [
    {
      "pid": 1234,
      "name": "chrome",
      "avg_cpu": 12.5,
      "memory_mb": 450,
      "num_connections": 23,
      "io_write_rate": 1024
    },
    {
      "pid": 5678,
      "name": "suspicious.exe",
      "avg_cpu": 95.0,
      "memory_mb": 2048,
      "num_connections": 1,
      "io_write_rate": 50000000
    }
  ],
  "file_activity": {
    "files_created": 500,
    "files_modified": 2300
  }
}`}
                        </CodeBlock>
                        <CodeBlock title="Response" lang="json">
                            {`{
  "status": "success",
  "data": {
    "device_id": "abc-123",
    "threats_detected": 1,
    "anomalies": [
      {
        "pid": 5678,
        "name": "suspicious.exe",
        "anomaly_score": 0.87,
        "severity": "critical",
        "threat_type": "ransomware",
        "explanation": "Process encrypting files at 50MB/s with high CPU",
        "recommended_action": "Isolate device immediately"
      }
    ]
  }
}`}
                        </CodeBlock>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    TECH STACK
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="tech-stack"
                        icon={Layers}
                        title="Tech Stack"
                        subtitle="Modern, fully-typed, production-ready stack."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Frontend */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-blue-400" /> Frontend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[
                                        ["Next.js 16", "React meta-framework with App Router & SSR"],
                                        ["React 19", "UI with Server Components"],
                                        ["TypeScript 5", "End-to-end type safety"],
                                        ["Tailwind CSS 4", "Utility-first CSS with glassmorphism"],
                                        ["Radix UI", "Accessible, unstyled primitives"],
                                        ["Recharts", "Data visualization (Area, Bar charts)"],
                                        ["TanStack Query", "Server state with smart caching"],
                                        ["Supabase SSR", "Server-side auth with HTTP-only cookies"],
                                    ].map(([name, desc]) => (
                                        <div key={name} className="flex items-start gap-2 text-sm">
                                            <span className="text-orange-400 font-mono font-semibold min-w-[120px] shrink-0">{name}</span>
                                            <span className="text-neutral-400">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Backend */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Server className="h-4 w-4 text-emerald-400" /> Backend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[
                                        ["FastAPI", "Async Python API with Swagger docs"],
                                        ["Uvicorn", "ASGI server for production"],
                                        ["scikit-learn", "Isolation Forest anomaly detection"],
                                        ["NumPy", "Feature vector computation"],
                                        ["SQLAlchemy 2", "Async ORM for PostgreSQL + SQLite"],
                                        ["Pydantic 2", "Request/response validation"],
                                        ["HTTPX", "Async HTTP client"],
                                        ["structlog", "Structured JSON logging"],
                                    ].map(([name, desc]) => (
                                        <div key={name} className="flex items-start gap-2 text-sm">
                                            <span className="text-emerald-400 font-mono font-semibold min-w-[120px] shrink-0">{name}</span>
                                            <span className="text-neutral-400">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Agent */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-purple-400" /> Endpoint Agent
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[
                                        ["psutil", "Cross-platform process monitoring"],
                                        ["watchdog", "Filesystem event monitoring"],
                                        ["requests", "HTTP communication with backend"],
                                        ["schedule", "Periodic heartbeat scheduling"],
                                    ].map(([name, desc]) => (
                                        <div key={name} className="flex items-start gap-2 text-sm">
                                            <span className="text-purple-400 font-mono font-semibold min-w-[120px] shrink-0">{name}</span>
                                            <span className="text-neutral-400">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Infrastructure */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Database className="h-4 w-4 text-amber-400" /> Infrastructure
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[
                                        ["Supabase", "PostgreSQL, Auth, Row Level Security"],
                                        ["Docker", "Full-stack containerization"],
                                        ["Vercel", "Optional frontend deployment"],
                                        ["Google Gemini", "AI chatbot integration"],
                                    ].map(([name, desc]) => (
                                        <div key={name} className="flex items-start gap-2 text-sm">
                                            <span className="text-amber-400 font-mono font-semibold min-w-[120px] shrink-0">{name}</span>
                                            <span className="text-neutral-400">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    GETTING STARTED
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="getting-started"
                        icon={Terminal}
                        title="Getting Started"
                        subtitle="Up and running in 5 minutes."
                    />

                    <div className="space-y-6">
                        {/* Quick Start */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Quick Start</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CodeBlock title="Terminal">
                                    {`# 1. Clone the repository
git clone https://github.com/balaraj74/cybershield.git
cd cybershield

# 2. Frontend setup
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# 3. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# 4. Start Backend (Terminal 1)
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 5. Start Frontend (Terminal 2)
cd .. && npm run dev`}
                                </CodeBlock>
                                <p className="mt-3 text-sm text-neutral-500">
                                    Open <span className="text-orange-300 font-mono">http://localhost:3000</span> — you&apos;re ready!
                                </p>
                            </CardContent>
                        </Card>

                        {/* Docker */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Docker Compose</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CodeBlock title="Terminal">
                                    {`docker-compose up --build -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:8001
# API Docs: http://localhost:8001/docs`}
                                </CodeBlock>
                            </CardContent>
                        </Card>

                        {/* Agent */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Deploy the Endpoint Agent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CodeBlock title="Terminal — on each device to protect">
                                    {`cd agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure connection
cp .env.example .env
# Edit BACKEND_URL=http://your-server:8001

# Start monitoring
python3 agent.py`}
                                </CodeBlock>
                                <p className="mt-3 text-sm text-neutral-500">
                                    The agent registers automatically, begins monitoring, and appears on your Endpoints dashboard.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    ENVIRONMENT VARIABLES
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="environment"
                        icon={Lock}
                        title="Environment Variables"
                        subtitle="Configuration for frontend, backend, and agent."
                    />

                    <div className="space-y-5">
                        {/* Frontend */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Frontend — .env.local</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-xl border border-neutral-800/40">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-800/40 bg-neutral-900/50">
                                                <th className="px-4 py-2 text-left font-semibold text-neutral-300">Variable</th>
                                                <th className="px-4 py-2 text-left font-semibold text-neutral-300">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                ["AUTH_SECRET", "Secret key for auth (≥32 chars)"],
                                                ["AUTH_URL", "App URL (http://localhost:3000)"],
                                                ["FASTAPI_URL", "Backend URL (http://localhost:8001)"],
                                                ["FASTAPI_API_KEY", "API key for backend communication"],
                                                ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
                                                ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anonymous key"],
                                                ["NEXT_PUBLIC_APP_NAME", 'App display name ("CyberShield AI")'],
                                                ["NEXT_PUBLIC_DEMO_MODE", "Enable demo mode (true/false)"],
                                            ].map(([name, desc]) => (
                                                <tr key={name} className="border-b border-neutral-800/20 last:border-0">
                                                    <td className="px-4 py-2 font-mono text-[13px] text-orange-300/90">{name}</td>
                                                    <td className="px-4 py-2 text-neutral-400">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Backend */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Backend — backend/.env</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-xl border border-neutral-800/40">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-800/40 bg-neutral-900/50">
                                                <th className="px-4 py-2 text-left font-semibold text-neutral-300">Variable</th>
                                                <th className="px-4 py-2 text-left font-semibold text-neutral-300">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                ["APP_NAME", "Application name"],
                                                ["DEBUG", "Debug mode (true/false)"],
                                                ["DEMO_MODE", "Demo mode (true/false)"],
                                                ["HOST", "Server host (0.0.0.0)"],
                                                ["PORT", "Server port (8001)"],
                                                ["DATABASE_URL", "PostgreSQL connection string"],
                                                ["SECRET_KEY", "JWT secret key"],
                                                ["API_KEY", "API authentication key"],
                                                ["MODEL_CONFIDENCE_THRESHOLD", "ML model threshold (0.5)"],
                                                ["MAX_CONTENT_LENGTH", "Max analyze content length (50000)"],
                                                ["RETENTION_DAYS", "Data retention period (30)"],
                                                ["ANONYMIZE_DATA", "Enable data anonymization (true)"],
                                            ].map(([name, desc]) => (
                                                <tr key={name} className="border-b border-neutral-800/20 last:border-0">
                                                    <td className="px-4 py-2 font-mono text-[13px] text-orange-300/90">{name}</td>
                                                    <td className="px-4 py-2 text-neutral-400">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Agent */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Agent — agent/.env</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-xl border border-neutral-800/40">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-800/40 bg-neutral-900/50">
                                                <th className="px-4 py-2 text-left font-semibold text-neutral-300">Variable</th>
                                                <th className="px-4 py-2 text-left font-semibold text-neutral-300">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                ["DEVICE_NAME", "Unique device identifier"],
                                                ["BACKEND_URL", "Backend server URL"],
                                                ["API_KEY", "API authentication key"],
                                                ["SCAN_INTERVAL", "Process scan interval in seconds (30)"],
                                                ["HEARTBEAT_INTERVAL", "Heartbeat interval in seconds (60)"],
                                                ["ENABLE_FILE_WATCH", "Enable file system watcher (true)"],
                                                ["ENABLE_NETWORK_MONITOR", "Enable network monitoring (true)"],
                                                ["ENABLE_AUTO_RESPONSE", "Enable auto-response actions (false)"],
                                                ["LOG_LEVEL", "Logging level (INFO)"],
                                            ].map(([name, desc]) => (
                                                <tr key={name} className="border-b border-neutral-800/20 last:border-0">
                                                    <td className="px-4 py-2 font-mono text-[13px] text-orange-300/90">{name}</td>
                                                    <td className="px-4 py-2 text-neutral-400">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    DATABASE SCHEMA
                   ════════════════════════════════════════════════ */}
                <section>
                    <SectionHeading
                        id="database"
                        icon={Database}
                        title="Database Schema"
                        subtitle="Dual-database architecture for security and performance."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Database className="h-4 w-4 text-emerald-400" /> Supabase PostgreSQL
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { table: "threat_analyses", purpose: "Anonymized analysis results (no raw content)", rls: true },
                                        { table: "user_feedback", purpose: "False positive/negative reports for AI improvement", rls: true },
                                        { table: "audit_logs", purpose: "Security action audit trail", rls: true },
                                        { table: "user_settings", purpose: "Per-user preferences", rls: true },
                                    ].map((t) => (
                                        <div key={t.table} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/20">
                                            <div className="font-mono text-sm text-emerald-300 min-w-[140px] shrink-0">{t.table}</div>
                                            <div className="text-sm text-neutral-400 flex-1">{t.purpose}</div>
                                            {t.rls && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5 shrink-0">RLS</span>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Database className="h-4 w-4 text-amber-400" /> SQLite (Local Endpoint Data)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        { table: "endpoint_devices", purpose: "Registered agents (hostname, OS, status, heartbeat)" },
                                        { table: "endpoint_threats", purpose: "Detected threats from endpoints" },
                                        { table: "endpoint_activities", purpose: "Process activity logs" },
                                        { table: "pending_commands", purpose: "Remote command queue (kill, isolate, scan)" },
                                    ].map((t) => (
                                        <div key={t.table} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/20">
                                            <div className="font-mono text-sm text-amber-300 min-w-[140px] shrink-0">{t.table}</div>
                                            <div className="text-sm text-neutral-400 flex-1">{t.purpose}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ════════════════════════════════════════════════
                    FOOTER
                   ════════════════════════════════════════════════ */}
                <div className="text-center pt-8 border-t border-neutral-800/40">
                    <p className="text-sm text-neutral-600">
                        CyberShield AI — Open source, MIT License
                    </p>
                    <p className="text-xs text-neutral-700 mt-1">
                        Built with Next.js 16 • FastAPI • scikit-learn • Supabase
                    </p>
                </div>
            </div>
        </div>
    );
}
