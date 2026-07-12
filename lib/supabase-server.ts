import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const url: string = supabaseUrl;
const key: string = serviceRoleKey;

export function createServerClient() {
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function createAuthClient() {
  if (!anonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  const authKey: string = anonKey;
  return createClient(url, authKey, {
    auth: { persistSession: false },
  });
}
