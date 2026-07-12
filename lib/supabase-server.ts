import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }
  const url: string = supabaseUrl;
  const key: string = serviceRoleKey;
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}

export function createAuthClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  const url: string = supabaseUrl;
  const key: string = anonKey;
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}
