/**
 * NextAuth.js configuration for CyberShield
 * Implements secure JWT-based authentication with RBAC
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { UserRole } from "@/types";

// Login schema validation
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

// Demo users for development/demo mode
// In production, this should validate against your user database
const DEMO_USERS = [
    {
        id: "1",
        email: "admin@cybershield.ai",
        password: "admin123secure",
        name: "Admin User",
        role: "admin" as UserRole,
    },
    {
        id: "2",
        email: "analyst@cybershield.ai",
        password: "analyst123secure",
        name: "Security Analyst",
        role: "analyst" as UserRole,
    },
    {
        id: "3",
        email: "viewer@cybershield.ai",
        password: "viewer123secure",
        name: "Viewer User",
        role: "viewer" as UserRole,
    },
];

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    // Validate input
                    const parsed = loginSchema.safeParse(credentials);
                    if (!parsed.success) {
                        return null;
                    }

                    const { email, password } = parsed.data;

                    // Demo mode: Check against demo users
                    // In production: Validate against your database/auth service
                    const user = DEMO_USERS.find(
                        (u) => u.email === email && u.password === password
                    );

                    if (!user) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch {
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.id = user.id as string;
                token.role = (user as { role: UserRole }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role: UserRole }).role = token.role as UserRole;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Redirect to dashboard after login
            if (url === baseUrl || url === `${baseUrl}/`) {
                return `${baseUrl}/dashboard`;
            }
            // Allow relative URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            // Allow URLs on the same origin
            if (url.startsWith(baseUrl)) {
                return url;
            }
            return baseUrl;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    cookies: {
        sessionToken: {
            name: "cybershield.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
});

// Type augmentation for NextAuth v5
declare module "next-auth" {
    interface User {
        role?: UserRole;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        role: UserRole;
    }
}
