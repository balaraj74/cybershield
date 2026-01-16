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
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze", label: "Threat Analysis", icon: Search },
    { href: "/chatbot", label: "AI Assistant", icon: Bot, badge: "AI" },
    { href: "/url-check", label: "URL Checker", icon: Link2, badge: "NEW" },
    { href: "/sms-check", label: "SMS Detector", icon: MessageSquare },
    { href: "/password-check", label: "Password Check", icon: Key },
    { href: "/breach-check", label: "Breach Checker", icon: Database },
    { href: "/privacy-analyzer", label: "Privacy Analyzer", icon: FileText },
    { href: "/security-score", label: "Security Score", icon: Trophy, badge: "NEW" },
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
                    "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-all duration-300",
                    collapsed ? "w-[72px]" : "w-64"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="relative">
                            <Shield className="h-8 w-8 text-cyan-400" />
                            <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-emerald-400" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-lg font-bold text-transparent">
                                    CyberShield
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                    AI Security
                                </span>
                            </div>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", collapsed && "hidden")}
                        onClick={() => setCollapsed(true)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        const linkContent = (
                            <Link
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5 shrink-0 transition-colors",
                                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"
                                    )}
                                />
                                {!collapsed && (
                                    <span className="flex-1">{item.label}</span>
                                )}
                                {!collapsed && item.badge && (
                                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">
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

                {/* Role Badge & Expand Button */}
                <div className="border-t border-slate-800 p-3">
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2">
                                <Shield className="h-4 w-4 text-cyan-400" />
                                <span className="text-xs font-medium text-slate-400 capitalize">
                                    {userRole || "analyst"}
                                </span>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <LogOut className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Sign Out</TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
}
