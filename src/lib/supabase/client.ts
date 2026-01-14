/**
 * Supabase Client for Browser (Client Components)
 */
import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase credentials not configured");
        // Return a mock client that won't crash
        return null as unknown as ReturnType<typeof createBrowserClient>;
    }

    if (!supabaseClient) {
        supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }

    return supabaseClient;
}
