/**
 * Environment variable validation using t3-oss/env-nextjs
 * Ensures all required environment variables are properly set
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        // Auth
        AUTH_SECRET: z.string().min(32).default("cybershield-dev-secret-key-min-32-chars"),
        AUTH_URL: z.string().url().optional(),

        // FastAPI Backend
        FASTAPI_URL: z.string().url().default("http://localhost:8000"),
        FASTAPI_API_KEY: z.string().optional(),

        // Node environment
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

        // Rate limiting
        RATE_LIMIT_REQUESTS: z.coerce.number().default(100),
        RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    },
    client: {
        // Public environment variables (exposed to client)
        NEXT_PUBLIC_APP_NAME: z.string().default("CyberShield AI"),
        NEXT_PUBLIC_DEMO_MODE: z.coerce.boolean().default(true),
    },
    runtimeEnv: {
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_URL: process.env.AUTH_URL,
        FASTAPI_URL: process.env.FASTAPI_URL,
        FASTAPI_API_KEY: process.env.FASTAPI_API_KEY,
        NODE_ENV: process.env.NODE_ENV,
        RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
        NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
