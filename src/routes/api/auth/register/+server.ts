// src/routes/api/auth/register/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { getSupabaseAdmin } = await import('$lib/server/supabase');

		const body = await request.json();
		const { email, password, full_name, phone_number } = body;

		console.log('Register request:', { email, full_name, phone_number });

		if (!email || !password) {
			return json({ error: 'Email dan password harus diisi' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password minimal 6 karakter' }, { status: 400 });
		}

		if (!full_name || !phone_number) {
			return json({ error: 'Nama lengkap dan nomor HP harus diisi' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Cek apakah email sudah terdaftar
		const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
		const emailExists = existingUsers?.users.some((u) => u.email === email);

		if (emailExists) {
			return json({ error: 'Email sudah terdaftar' }, { status: 400 });
		}

		// Create user dengan email_confirm: false dan generate_link: true
		const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: false, // Ubah jadi false supaya kirim email
			user_metadata: {
				full_name,
				phone_number
			}
		});

		if (authError) {
			console.error('Create user error:', authError);
			return json({ error: authError.message || 'Gagal membuat akun' }, { status: 400 });
		}

		if (!userData || !userData.user) {
			return json({ error: 'Gagal membuat akun' }, { status: 500 });
		}

		console.log('User created:', userData.user.id);

		// Insert user role
		const { data: existingRole } = await supabaseAdmin
			.from('user_roles')
			.select('user_id')
			.eq('user_id', userData.user.id)
			.single();

		if (existingRole) {
			console.log('User role already exists, updating...');

			const { error: updateError } = await supabaseAdmin
				.from('user_roles')
				.update({
					full_name,
					phone_number,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', userData.user.id);

			if (updateError) {
				console.error('Update role error:', updateError);
				return json({ error: 'Gagal update data user' }, { status: 500 });
			}
		} else {
			console.log('Inserting new user role...');

			const { error: insertError } = await supabaseAdmin.from('user_roles').insert({
				user_id: userData.user.id,
				role: 'user',
				full_name,
				phone_number
			});

			if (insertError) {
				console.error('Insert role error:', insertError);
				await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
				return json({ error: 'Gagal menyimpan data user' }, { status: 500 });
			}
		}

		console.log('User role saved successfully');

		// Generate email verification link
		const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
			type: 'signup',
			email: email,
			password: password,
			options: {
				redirectTo: `${new URL(request.url).origin}/login`
			}
		});

		if (linkError) {
			console.error('Generate link error:', linkError);
			// Tidak return error, user tetap berhasil dibuat
		} else {
			console.log('Verification link generated:', linkData.properties.action_link);
		}

		return json({
			success: true,
			message: 'Registrasi berhasil. Cek email Anda untuk verifikasi akun.'
		});
	} catch (error) {
		console.error('Register error:', error);
		return json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
