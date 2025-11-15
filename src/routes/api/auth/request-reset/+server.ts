import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return json({ error: 'Email harus diisi' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Send reset password email
		const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
			redirectTo: `${new URL(request.url).origin}/reset-password`
		});

		if (error) {
			console.error('Reset password error:', error);
			// Jangan kasih tau user kalau email tidak ditemukan (security)
			return json({
				success: true,
				message: 'Jika email terdaftar, link reset password akan dikirim'
			});
		}

		return json({
			success: true,
			message: 'Link reset password telah dikirim ke email Anda'
		});
	} catch (error) {
		console.error('Request reset error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
