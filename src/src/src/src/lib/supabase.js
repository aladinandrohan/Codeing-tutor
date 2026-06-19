import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ihriqgvhlxgdwvevcpbk.supabase.co";

// Publishable key — safe to expose in frontend code
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_w_KLTRULxo-1JurVeSdwjA_v_DdNscx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
