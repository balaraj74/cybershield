"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Search,
    History,
    Settings,
    Shield,
    ShieldCheck,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Lock,
    Bot,
    Key,
    Database,
    FileText,
    Link2,
    MessageSquare,
    Trophy,
    Brain,
    Bug,
    Network,
    Zap,
    EyeOff,
    Gauge,
    Fish,
    UserX,
    ClipboardCheck,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    permission?: string;
    separator?: boolean;
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/endpoints", label: "Endpoint Protection", icon: Shield, badge: "LIVE" },
    { href: "/analyze", label: "Threat Analysis", icon: Search },
    { href: "/chatbot", label: "AI Assistant", icon: Bot, badge: "AI" },
    { href: "/url-check", label: "URL Checker", icon: Link2 },
    { href: "/sms-check", label: "SMS Detector", icon: MessageSquare },
    { href: "/password-check", label: "Password Check", icon: Key },
    { href: "/breach-check", label: "Breach Checker", icon: Database },
    { href: "/privacy-analyzer", label: "Privacy Analyzer", icon: FileText },
    { href: "/security-score", label: "Security Score", icon: Trophy },
    // AI Security Modules
    { href: "", label: "AI MODULES", icon: Brain, separator: true },
    { href: "/modules", label: "Modules Overview", icon: Brain, badge: "9" },
    { href: "/modules/network-ids", label: "Network IDS", icon: Network, badge: "AI" },
    { href: "/modules/behavior-malware", label: "Malware Detection", icon: Bug, badge: "AI" },
    { href: "/modules/autonomous-response", label: "Auto Response", icon: Zap },
    { href: "/modules/privacy-ai", label: "Privacy AI", icon: EyeOff },
    { href: "/modules/risk-score", label: "Risk Score", icon: Gauge },
    { href: "/modules/phishing", label: "Phishing Detection", icon: Fish, badge: "AI" },
    { href: "/modules/insider-threat", label: "Insider Threat", icon: UserX },
    { href: "/modules/compliance", label: "Compliance", icon: ClipboardCheck },
    // Bottom
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
    userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-800/40 bg-[#0c0c0c] transition-all duration-300",
                    collapsed ? "w-[72px]" : "w-56"
                )}
            >
                {/* Logo */}
                <div className="flex h-14 items-center justify-between border-b border-neutral-800/40 px-4">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="relative">
                            <Shield className="h-7 w-7 text-orange-500" />
                            <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-green-500" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-base font-bold tracking-tight">
                                    <span className="text-orange-500">CY</span>
                                    <span className="text-neutral-200"> · SHIELD</span>
                                </span>
                            </div>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-7 w-7", collapsed && "hidden")}
                        onClick={() => setCollapsed(true)}
                    >
                        <ChevronLeft className="h-4 w-4 text-neutral-500" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 scrollbar-hide">
                    {navItems.map((item, idx) => {
                        // Render separator
                        if (item.separator) {
                            if (collapsed) {
                                return (
                                    <div key={`sep-${idx}`} className="my-3 border-t border-neutral-800/30" />
                                );
                            }
                            return (
                                <div key={`sep-${idx}`} className="mt-5 mb-2 pt-3 border-t border-neutral-800/30">
                                    <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                                        {item.label}
                                    </span>
                                </div>
                            );
                        }

                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        const linkContent = (
                            <Link
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                                    isActive
                                        ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500"
                                        : "text-neutral-500 hover:bg-neutral-800/40 hover:text-neutral-300 border-l-2 border-transparent"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-[18px] w-[18px] shrink-0 transition-colors",
                                        isActive ? "text-orange-400" : "text-neutral-600 group-hover:text-neutral-400"
                                    )}
                                />
                                {!collapsed && (
                                    <span className="flex-1 truncate">{item.label}</span>
                                )}
                                {!collapsed && item.badge && (
                                    <span className={cn(
                                        "rounded px-1.5 py-0.5 text-[9px] font-bold",
                                        isActive
                                            ? "bg-orange-500/20 text-orange-400"
                                            : "bg-neutral-800 text-neutral-500"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right" className="font-medium">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return <div key={item.href}>{linkContent}</div>;
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-neutral-800/40 p-3">
                    {collapsed ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-full"
                            onClick={() => setCollapsed(false)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-neutral-500 hover:bg-neutral-800/40 hover:text-neutral-300 transition-colors">
                                <HelpCircle className="h-4 w-4" />
                                <span>Help & Docs</span>
                            </Link>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 px-3 py-1.5">
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">
                                            {(userRole || "U")[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-neutral-300 capitalize">
                                            {userRole || "analyst"}
                                        </span>
                                    </div>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <LogOut className="h-4 w-4 text-neutral-600" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Sign Out</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
}
