"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/supabase/auth-provider";
import Link from "next/link";

interface HeaderProps {
    user?: {
        name?: string;
        email?: string;
        role?: string;
    };
    onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
    const { signOut } = useAuth();

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-800/40 bg-[#0a0a0a]/90 px-6 backdrop-blur-xl">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                    <Input
                        placeholder="Search threats, alerts..."
                        className="w-64 bg-neutral-900/40 pl-9 lg:w-80 border-neutral-800/50 h-9 text-xs"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Live Mode Badge */}
                <div className="hidden sm:flex items-center gap-2 rounded-md border border-orange-500/20 bg-orange-500/5 px-3 py-1">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                    </span>
                    <span className="text-[11px] font-medium text-orange-400">Live Mode</span>
                </div>

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9">
                            <Bell className="h-4 w-4 text-neutral-500" />
                            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                3
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="font-medium">Critical Threat Detected</span>
                            </div>
                            <span className="text-xs text-neutral-500">
                                Phishing attempt identified in recent email analysis
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                <span className="font-medium">New Analysis Complete</span>
                            </div>
                            <span className="text-xs text-neutral-500">
                                URL scan completed with warnings
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                                <span className="font-medium">System Update</span>
                            </div>
                            <span className="text-xs text-neutral-500">
                                AI model updated to latest version
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-orange-400">
                            View all notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 px-2 hover:bg-neutral-800/50"
                        >
                            <Avatar className="h-7 w-7">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-[10px] bg-gradient-to-br from-orange-500 to-amber-600 text-white">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="hidden flex-col items-start md:flex">
                                <span className="text-xs font-medium text-neutral-200">
                                    {user?.name || "User"}
                                </span>
                                <span className="text-[10px] capitalize text-neutral-500">
                                    {user?.role || "analyst"}
                                </span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <span>{user?.name || "User"}</span>
                                <span className="text-xs font-normal text-neutral-500">
                                    {user?.email || "user@example.com"}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/privacy">Privacy</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-400 focus:text-red-400"
                            onClick={() => signOut()}
                        >
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
