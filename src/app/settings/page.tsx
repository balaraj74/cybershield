"use client";

import { useState } from "react";
import {
    Bell,
    Monitor,
    Shield,
    User,
    Save,
    Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SuccessAlert } from "@/components/alerts/alert";

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        notifications: {
            emailAlerts: true,
            highRiskOnly: false,
        },
        display: {
            compactView: false,
            autoRefresh: true,
            refreshInterval: "60",
        },
        privacy: {
            retentionDays: "30",
            anonymizeData: true,
        },
    });

    const handleSave = () => {
        // In production, save to backend
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="mt-1 text-slate-400">
                    Configure your security preferences and display options
                </p>
            </div>

            {saved && (
                <SuccessAlert title="Settings Saved">
                    Your preferences have been updated successfully.
                </SuccessAlert>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Notification Settings */}
                <Card variant="elevated">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                                <Bell className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Notifications</CardTitle>
                                <CardDescription>
                                    Configure how you receive alerts
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-white">Email Alerts</Label>
                                <p className="text-sm text-slate-500">
                                    Receive threat alerts via email
                                </p>
                            </div>
                            <Switch
                                checked={settings.notifications.emailAlerts}
                                onCheckedChange={(checked) =>
                                    setSettings((s) => ({
                                        ...s,
                                        notifications: { ...s.notifications, emailAlerts: checked },
                                    }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-white">High Risk Only</Label>
                                <p className="text-sm text-slate-500">
                                    Only notify for critical threats
                                </p>
                            </div>
                            <Switch
                                checked={settings.notifications.highRiskOnly}
                                onCheckedChange={(checked) =>
                                    setSettings((s) => ({
                                        ...s,
                                        notifications: { ...s.notifications, highRiskOnly: checked },
                                    }))
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Display Settings */}
                <Card variant="elevated">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                <Monitor className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Display</CardTitle>
                                <CardDescription>
                                    Customize your dashboard experience
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-white">Compact View</Label>
                                <p className="text-sm text-slate-500">
                                    Use a more condensed layout
                                </p>
                            </div>
                            <Switch
                                checked={settings.display.compactView}
                                onCheckedChange={(checked) =>
                                    setSettings((s) => ({
                                        ...s,
                                        display: { ...s.display, compactView: checked },
                                    }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-white">Auto Refresh</Label>
                                <p className="text-sm text-slate-500">
                                    Automatically update dashboard
                                </p>
                            </div>
                            <Switch
                                checked={settings.display.autoRefresh}
                                onCheckedChange={(checked) =>
                                    setSettings((s) => ({
                                        ...s,
                                        display: { ...s.display, autoRefresh: checked },
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Refresh Interval</Label>
                            <Select
                                value={settings.display.refreshInterval}
                                onValueChange={(value) =>
                                    setSettings((s) => ({
                                        ...s,
                                        display: { ...s.display, refreshInterval: value },
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">Every 30 seconds</SelectItem>
                                    <SelectItem value="60">Every minute</SelectItem>
                                    <SelectItem value="300">Every 5 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card variant="elevated">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                                <Shield className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Privacy & Data</CardTitle>
                                <CardDescription>
                                    Manage your data retention preferences
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Data Retention Period</Label>
                            <Select
                                value={settings.privacy.retentionDays}
                                onValueChange={(value) =>
                                    setSettings((s) => ({
                                        ...s,
                                        privacy: { ...s.privacy, retentionDays: value },
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                    <SelectItem value="365">1 year</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                                Anonymized records older than this will be deleted
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-white">Anonymize Data</Label>
                                <p className="text-sm text-slate-500">
                                    Hash all identifiable content
                                </p>
                            </div>
                            <Switch
                                checked={settings.privacy.anonymizeData}
                                onCheckedChange={(checked) =>
                                    setSettings((s) => ({
                                        ...s,
                                        privacy: { ...s.privacy, anonymizeData: checked },
                                    }))
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card variant="elevated">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                <User className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Account</CardTitle>
                                <CardDescription>
                                    Manage your account information
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input placeholder="Your name" defaultValue="Security Analyst" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="you@company.com"
                                defaultValue="analyst@cybershield.ai"
                                disabled
                            />
                            <p className="text-xs text-slate-500">
                                Contact admin to change email
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button size="lg" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
