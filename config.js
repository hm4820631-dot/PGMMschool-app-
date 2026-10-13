import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const SUPABASE_URL = 'https://jbdeqrjpsvesxdgnibch.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_E1VkT-j_x0ju_t48EQnpSA_eEkNLjJs';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

