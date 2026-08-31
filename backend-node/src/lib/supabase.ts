import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { createLogger } from "./logger.js";

const log = createLogger("supabase");
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY;
const SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_JWKS_URL = env.SUPABASE_JWKS_URL;

export const isSupabaseConfigured: boolean = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { apikey: SUPABASE_SECRET_KEY!, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` } },
    })
  : null;

export const supabaseAnon: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { autoRefreshToken: true, persistSession: true },
      global: { headers: { apikey: SUPABASE_PUBLISHABLE_KEY! } },
    })
  : null;

export const supabaseJwksUrl: string | null = SUPABASE_JWKS_URL ?? null;

if (isSupabaseConfigured) log.info("Supabase client initialized", { url: SUPABASE_URL });
else log.warn("Supabase not configured");
