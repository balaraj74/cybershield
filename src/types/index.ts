/**
 * Core type definitions for CyberShield AI Platform
 */

// User & Authentication Types
export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    lastLoginAt?: Date;
}

export interface Session {
    user: User;
    expires: string;
    accessToken?: string;
}

// Threat Analysis Types
export type ThreatType =
    | "phishing"
    | "malware"
    | "spam"
    | "social_engineering"
    | "credential_theft"
    | "url_threat"
    | "data_exfiltration"
    | "unknown";

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "safe";

export type AnalysisInputType = "email" | "message" | "url";

export interface AnalysisRequest {
    type: AnalysisInputType;
    content: string;
    metadata?: {
        source?: string;
        timestamp?: string;
    };
}

export interface ThreatIndicator {
    type: "keyword" | "url" | "pattern" | "behavioral";
    value: string;
    riskContribution: number;
    description: string;
}

export interface ExplanationSection {
    title: string;
    content: string;
    severity: SeverityLevel;
    indicators?: ThreatIndicator[];
}

export interface AnalysisResult {
    id: string;
    threatType: ThreatType;
    riskScore: number; // 0-100
    severity: SeverityLevel;
    confidence: number; // 0-100
    summary: string;
    explanation: ExplanationSection[];
    indicators: ThreatIndicator[];
    recommendations: string[];
    riskContributions?: { factor: string; weight: number }[];
    analyzedAt: string;
    inputHash: string; // Hash of input for reference, no raw data stored
}

// History & Audit Types
export interface HistoryEntry {
    id: string;
    inputType: AnalysisInputType;
    inputHash: string;
    threatType: ThreatType;
    severity: SeverityLevel;
    riskScore: number;
    analyzedAt: string;
    analyzedBy: string;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    userId: string;
    timestamp: string;
    details?: Record<string, unknown>;
}

// Dashboard Statistics Types
export interface ThreatStats {
    totalThreats: number;
    highRiskCount: number;
    threatsByType: Record<ThreatType, number>;
    threatsOverTime: {
        date: string;
        count: number;
    }[];
    recentAlerts: HistoryEntry[];
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    timestamp: string;
}

// Settings Types
export interface UserSettings {
    notifications: {
        emailAlerts: boolean;
        highRiskOnly: boolean;
    };
    display: {
        compactView: boolean;
        autoRefresh: boolean;
        refreshInterval: number;
    };
    privacy: {
        retentionDays: number;
        anonymizeData: boolean;
    };
}

// Privacy Types
export interface PrivacyPolicy {
    version: string;
    lastUpdated: string;
    sections: {
        title: string;
        content: string;
    }[];
}

export interface DataRetentionInfo {
    policyVersion: string;
    retentionPeriod: string;
    deletionSchedule: string;
    dataTypes: {
        type: string;
        retained: boolean;
        duration: string;
    }[];
}
