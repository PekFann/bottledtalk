import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export async function cleanupExpiredBottles(): Promise<number> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.rpc("cleanup_expired_bottles");

  if (error) throw error;
  return data as number;
}
