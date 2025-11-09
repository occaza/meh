// src/routes/api/auth/session/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { access_token, refresh_token } = body;

		if (!access_token || !refresh_token) {
			return json({ error: 'Missing tokens' }, { status: 400 });
		}

		// Set cookies dengan HttpOnly untuk keamanan
		cookies.set('sb-access-token', access_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 hari
		});

		cookies.set('sb-refresh-token', refresh_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 hari
		});

		return json({ success: true });
	} catch (error) {
		console.error('Session save error:', error);
		return json({ error: 'Failed to save session' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	// Untuk logout
	cookies.delete('sb-access-token', { path: '/' });
	cookies.delete('sb-refresh-token', { path: '/' });
	return json({ success: true });
};
