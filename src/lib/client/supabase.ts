// src/lib/client/supabase.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error('Missing Supabase public credentials!');
	}

	return createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true
		}
	});
}
