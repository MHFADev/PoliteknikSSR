"use client";

// Supabase client khusus untuk Client Component (browser).
// Dipakai di dalam komponen yang punya "use client", misal QRScanner, form dengan realtime, dll.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
