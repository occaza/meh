import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRole = import.meta.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
	throw new Error('Missing Supabase credentials');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
