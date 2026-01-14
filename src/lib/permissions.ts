/**
 * Role-Based Access Control (RBAC) permissions system
 */
import type { UserRole } from "@/types";

// Define all possible permissions in the system
export type Permission =
    | "view_dashboard"
    | "view_analysis"
    | "perform_analysis"
    | "view_history"
    | "delete_history"
    | "view_settings"
    | "modify_settings"
    | "view_privacy"
    | "manage_users"
    | "view_audit_logs"
    | "export_data"
    | "access_api";

// Permission matrix for each role
const rolePermissions: Record<UserRole, Permission[]> = {
    admin: [
        "view_dashboard",
        "view_analysis",
        "perform_analysis",
        "view_history",
        "delete_history",
        "view_settings",
        "modify_settings",
        "view_privacy",
        "manage_users",
        "view_audit_logs",
        "export_data",
        "access_api",
    ],
    analyst: [
        "view_dashboard",
        "view_analysis",
        "perform_analysis",
        "view_history",
        "view_settings",
        "modify_settings",
        "view_privacy",
        "export_data",
        "access_api",
    ],
    viewer: [
        "view_dashboard",
        "view_analysis",
        "view_history",
        "view_settings",
        "view_privacy",
    ],
};

/**
 * Checks if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Gets all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
    return rolePermissions[role] ?? [];
}

/**
 * Checks if user can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
    const routePermissions: Record<string, Permission> = {
        "/dashboard": "view_dashboard",
        "/analyze": "view_analysis",
        "/history": "view_history",
        "/settings": "view_settings",
        "/privacy": "view_privacy",
        "/admin": "manage_users",
        "/audit": "view_audit_logs",
    };

    const requiredPermission = routePermissions[route];
    if (!requiredPermission) return true; // Public route
    return hasPermission(role, requiredPermission);
}

/**
 * Role hierarchy for comparison
 */
const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    analyst: 2,
    viewer: 1,
};

/**
 * Checks if roleA has equal or higher privileges than roleB
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
    return roleHierarchy[roleA] >= roleHierarchy[roleB];
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        admin: "Administrator",
        analyst: "Security Analyst",
        viewer: "Viewer",
    };
    return names[role] ?? role;
}
