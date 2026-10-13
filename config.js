import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

// Supabase dashboard -> Project Settings -> API
const SUPABASE_URL = 'PASTE_YOUR_PROJECT_URL';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_PUBLIC_KEY';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
