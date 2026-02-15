"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
    LayoutDashboard,
    Shield,
    Search,
    Bot,
    Link2,
    MessageSquare,
    Key,
    Database,
    FileText,
    Trophy,
    Brain,
    Network,
    Bug,
    Zap,
    EyeOff,
    Gauge,
    Fish,
    UserX,
    ClipboardCheck,
    History,
    Settings,
    ChevronUp,
    ChevronDown,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DockItem {
    href: string;
    label: string;
    icon: React.ElementType;
    group?: string;
}

const dockItems: DockItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
    { href: "/endpoints", label: "Endpoints", icon: Shield, group: "main" },
    { href: "/analyze", label: "Analyze", icon: Search, group: "main" },
    { href: "/chatbot", label: "AI Chat", icon: Bot, group: "main" },
    { href: "/url-check", label: "URL Check", icon: Link2, group: "tools" },
    { href: "/sms-check", label: "SMS Check", icon: MessageSquare, group: "tools" },
    { href: "/password-check", label: "Password", icon: Key, group: "tools" },
    { href: "/breach-check", label: "Breach", icon: Database, group: "tools" },
    { href: "/privacy-analyzer", label: "Privacy", icon: FileText, group: "tools" },
    { href: "/security-score", label: "Score", icon: Trophy, group: "tools" },
    { href: "/modules", label: "Modules", icon: Brain, group: "ai" },
    { href: "/modules/network-ids", label: "Net IDS", icon: Network, group: "ai" },
    { href: "/modules/behavior-malware", label: "Malware", icon: Bug, group: "ai" },
    { href: "/modules/autonomous-response", label: "Auto Resp", icon: Zap, group: "ai" },
    { href: "/modules/privacy-ai", label: "Privacy AI", icon: EyeOff, group: "ai" },
    { href: "/modules/risk-score", label: "Risk", icon: Gauge, group: "ai" },
    { href: "/modules/phishing", label: "Phishing", icon: Fish, group: "ai" },
    { href: "/modules/insider-threat", label: "Insider", icon: UserX, group: "ai" },
    { href: "/modules/compliance", label: "Compliance", icon: ClipboardCheck, group: "ai" },
    { href: "/history", label: "History", icon: History, group: "system" },
    { href: "/settings", label: "Settings", icon: Settings, group: "system" },
];

function DockIcon({
    item,
    isActive,
    mouseX,
    index,
    totalInView,
}: {
    item: DockItem;
    isActive: boolean;
    mouseX: number | null;
    index: number;
    totalInView: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (mouseX === null || !ref.current) {
            setScale(1);
            return;
        }
        const rect = ref.current.getBoundingClientRect();
        const iconCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(mouseX - iconCenterY);
        const maxDistance = 120;
        const newScale = Math.max(1, 1.4 - (distance / maxDistance) * 0.4);
        setScale(distance < maxDistance ? newScale : 1);
    }, [mouseX]);

    const Icon = item.icon;

    return (
        <div ref={ref} className="relative group flex items-center justify-center">
            <Link
                href={item.href}
                className={cn(
                    "relative flex items-center justify-center rounded-xl transition-all duration-200 ease-out",
                    isActive
                        ? "bg-orange-500/15 text-orange-400 shadow-lg shadow-orange-500/10"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60"
                )}
                style={{
                    width: `${scale * 40}px`,
                    height: `${scale * 40}px`,
                }}
            >
                <Icon
                    style={{
                        width: `${scale * 18}px`,
                        height: `${scale * 18}px`,
                    }}
                    className="transition-colors duration-150"
                />
                {isActive && (
                    <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-full bg-orange-500" />
                )}
            </Link>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-700/50 text-[11px] font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
            </div>
        </div>
    );
}

export function FloatingDock() {
    const pathname = usePathname();
    const [mouseY, setMouseY] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(false);
    const dockRef = useRef<HTMLDivElement>(null);

    // Show a compact view by default — main items + current group
    const currentGroup = dockItems.find((i) => pathname.startsWith(i.href))?.group || "main";

    const visibleItems = expanded
        ? dockItems
        : [
            ...dockItems.filter((i) => i.group === "main"),
            ...(currentGroup !== "main" ? dockItems.filter((i) => i.group === currentGroup) : []),
            ...dockItems.filter((i) => i.group === "system"),
        ];

    // Deduplicate
    const seen = new Set<string>();
    const uniqueItems = visibleItems.filter((item) => {
        if (seen.has(item.href)) return false;
        seen.add(item.href);
        return true;
    });

    const handleMouseMove = (e: React.MouseEvent) => {
        setMouseY(e.clientY);
    };

    const handleMouseLeave = () => {
        setMouseY(null);
    };

    // Group labels for separators
    let lastGroup = "";

    return (
        <div
            ref={dockRef}
            className="fixed left-3 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative flex flex-col items-center gap-1 rounded-2xl border border-neutral-800/50 bg-[#0c0c0c]/90 backdrop-blur-2xl p-2 shadow-2xl shadow-black/50">
                {/* Logo at top */}
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center w-10 h-10 rounded-xl mb-1 group"
                >
                    <div className="relative">
                        <Shield className="h-6 w-6 text-orange-500 group-hover:text-orange-400 transition-colors" />
                    </div>
                </Link>

                <div className="w-6 h-px bg-neutral-800/60 mb-1" />

                {/* Dock items */}
                {uniqueItems.map((item, idx) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/modules" && pathname.startsWith(item.href) && item.href !== "/");
                    const showSep = item.group !== lastGroup && idx > 0;
                    lastGroup = item.group || "";

                    return (
                        <div key={item.href}>
                            {showSep && <div className="w-6 h-px bg-neutral-800/40 my-1 mx-auto" />}
                            <DockIcon
                                item={item}
                                isActive={isActive}
                                mouseX={mouseY}
                                index={idx}
                                totalInView={uniqueItems.length}
                            />
                        </div>
                    );
                })}

                <div className="w-6 h-px bg-neutral-800/60 mt-1" />

                {/* Expand / Collapse */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/50 transition-all mt-0.5"
                    title={expanded ? "Show less" : "Show all"}
                >
                    {expanded ? <X className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    );
}
