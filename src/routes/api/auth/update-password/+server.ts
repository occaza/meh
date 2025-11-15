import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { password, access_token } = body;

		console.log('Update password request:', {
			hasPassword: !!password,
			passwordLength: password?.length,
			hasToken: !!access_token,
			tokenPreview: access_token?.substring(0, 20) + '...'
		});

		if (!password) {
			console.error('Password missing');
			return json({ error: 'Password harus diisi' }, { status: 400 });
		}

		if (password.length < 6) {
			console.error('Password too short:', password.length);
			return json({ error: 'Password minimal 6 karakter' }, { status: 400 });
		}

		if (!access_token) {
			console.error('Access token missing');
			return json({ error: 'Auth session missing' }, { status: 400 });
		}

		const { getSupabaseAdmin } = await import('$lib/server/supabase');
		const supabaseAdmin = getSupabaseAdmin();

		console.log('Getting user from token...');

		// Get user dari token
		const { data: userData, error: getUserError } = await supabaseAdmin.auth.getUser(access_token);

		if (getUserError) {
			console.error('Get user error:', getUserError);
			return json(
				{
					error: 'Session tidak valid: ' + getUserError.message
				},
				{ status: 401 }
			);
		}

		if (!userData || !userData.user) {
			console.error('User data missing');
			return json({ error: 'User tidak ditemukan' }, { status: 401 });
		}

		console.log('User found:', userData.user.id);
		console.log('Updating password...');

		// Update password
		const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
			password: password
		});

		if (updateError) {
			console.error('Update password error:', updateError);
			return json(
				{
					error: 'Gagal update password: ' + updateError.message
				},
				{ status: 400 }
			);
		}

		console.log('Password updated successfully');

		return json({
			success: true,
			message: 'Password berhasil diubah'
		});
	} catch (error) {
		console.error('Update password exception:', error);
		return json(
			{
				error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown')
			},
			{ status: 500 }
		);
	}
};
