import "server-only";

// Session client: respects the authenticated user's RLS policies.
export {
  createSupabaseServerClient,
} from "./supabase/server";

// Administrative client: service credential stays server-only.
// Use only after trusted administrative authorization.
export {
  createSupabaseAdminClient,
} from "./supabase/admin";