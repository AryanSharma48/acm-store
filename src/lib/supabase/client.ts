import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Module-level singleton — @supabase/ssr's createBrowserClient must only be
// instantiated once per browser context. Without this, mounting multiple
// components that each call createClient() simultaneously (e.g. Header +
// CartPage + CheckoutPage) triggers a "Multiple GoTrueClient instances" warning
// and can produce undefined auth state behaviour.
let client: SupabaseClient | null = null

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
