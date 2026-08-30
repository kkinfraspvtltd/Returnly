import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVICE ROLE client — bypasses RLS on every table, not just admin
// ones. Import this ONLY in server-only files: API routes, this
// admin section's server components. NEVER import it in a 'use
// client' file — that would ship it straight into the browser bundle.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}