// src/lib/supabase.ts — Client-side Supabase
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase-server.ts — Server-side Supabase
// (put in separate file: supabase-server.ts)
