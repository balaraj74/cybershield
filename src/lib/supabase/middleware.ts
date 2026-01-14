/**
 * Supabase Middleware Client
 * Handles session refresh on every request
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Supabase not configured - skip auth checks
        console.warn("Supabase not configured, skipping auth middleware");
        return supabaseResponse;
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                        supabaseResponse = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // Refresh session if expired
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Define route types
        const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
            request.nextUrl.pathname.startsWith("/signup") ||
            request.nextUrl.pathname.startsWith("/auth");

        const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
            request.nextUrl.pathname.startsWith("/analyze") ||
            request.nextUrl.pathname.startsWith("/history") ||
            request.nextUrl.pathname.startsWith("/settings") ||
            request.nextUrl.pathname.startsWith("/privacy");

        // Redirect to login if accessing protected route without auth
        if (!user && isProtectedRoute) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }

        // Redirect to dashboard if already logged in and accessing auth routes
        if (user && isAuthRoute) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        return supabaseResponse;
    } catch (error) {
        console.error("Middleware auth error:", error);
        // On error, continue without auth check
        return supabaseResponse;
    }
}
