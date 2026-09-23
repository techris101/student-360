import { z } from "zod";

const emptyToUndefined = z.literal("").transform(() => undefined);
const optionalString = z.string().min(1).optional().or(emptyToUndefined);
const optionalUrl = z.string().url().optional().or(emptyToUndefined);
const optionalEmail = z.string().email().optional().or(emptyToUndefined);

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_PROJECT_REF: optionalString,
  SUPABASE_DB_PASSWORD: optionalString,
  SUPABASE_ACCESS_TOKEN: optionalString,
  GOOGLE_GENERATIVE_AI_API_KEY: optionalString,
  AI_MODEL_FAST: z.string().default("gemini-3.5-flash-lite"),
  AI_MODEL_SMART: z.string().default("gemini-3.6-flash"),
  AI_DAILY_MESSAGE_CAP: z.coerce.number().int().positive().default(30),
  VERCEL_TOKEN: optionalString,
  ADMIN_EMAILS: z
    .string()
    .default("techris101@gmail.com")
    .transform((val) =>
      val
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),
  CRON_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalEmail,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv cannot be called on the client side.");
  }

  return serverEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
    SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD,
    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    AI_MODEL_FAST: process.env.AI_MODEL_FAST,
    AI_MODEL_SMART: process.env.AI_MODEL_SMART,
    AI_DAILY_MESSAGE_CAP: process.env.AI_DAILY_MESSAGE_CAP,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    CRON_SECRET: process.env.CRON_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  });
}

export const env = {
  get client() {
    return getClientEnv();
  },
  get server() {
    return getServerEnv();
  },
};
