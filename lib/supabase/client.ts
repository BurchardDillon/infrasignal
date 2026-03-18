import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[supabase/client] Missing env vars:",
    JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "SET" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV,
    })
  );
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
