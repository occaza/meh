// src/lib/server/auth.ts
import { getSupabaseAdmin } from './supabase';
import type { Cookies } from '@sveltejs/kit';

export async function getUser(cookies: Cookies) {
	const accessToken = cookies.get('sb-access-token');
	const refreshToken = cookies.get('sb-refresh-token');

	if (!accessToken) {
		return null;
	}

	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase.auth.getUser(accessToken);

	if (error || !data.user) {
		return null;
	}

	return data.user;
}

export async function requireAuth(cookies: Cookies) {
	const user = await getUser(cookies);

	if (!user) {
		throw new Error('Unauthorized');
	}

	return user;
}
