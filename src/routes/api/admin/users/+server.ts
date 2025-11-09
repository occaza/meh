// src/routes/api/admin/users/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const supabaseAdmin = getSupabaseAdmin();

		const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

		if (authError) {
			console.error('List users error:', authError);
			return json({ error: 'Gagal memuat daftar user' }, { status: 500 });
		}

		// Ambil role dari tabel user_roles
		const { data: userRoles, error: rolesError } = await supabaseAdmin
			.from('user_roles')
			.select('user_id, role');

		if (rolesError) {
			console.error('Get roles error:', rolesError);
		}

		// Mapping role ke user
		const roleMap = new Map(userRoles?.map((r) => [r.user_id, r.role]) || []);

		// Filter: JANGAN tampilkan superadmin
		const users = authUsers.users
			.map((user) => ({
				id: user.id,
				email: user.email,
				role: roleMap.get(user.id) || 'user',
				created_at: user.created_at,
				last_sign_in_at: user.last_sign_in_at,
				confirmed_at: user.confirmed_at
			}))
			.filter((user) => user.role !== 'superadmin');

		return json(users);
	} catch (error) {
		console.error('Get users error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { email, password, role = 'user' } = body;

		if (!email || !password) {
			return json({ error: 'Email dan password harus diisi' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password minimal 6 karakter' }, { status: 400 });
		}

		// Hanya izinkan membuat user dengan role admin atau user
		if (!['admin', 'user'].includes(role)) {
			return json({ error: 'Role tidak valid' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});

		if (error) {
			console.error('Create user error:', error);
			return json({ error: error.message || 'Gagal membuat user' }, { status: 400 });
		}

		// Insert role ke tabel user_roles
		const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
			user_id: data.user.id,
			role
		});

		if (roleError) {
			console.error('Insert role error:', roleError);
			// Rollback: hapus user yang baru dibuat
			await supabaseAdmin.auth.admin.deleteUser(data.user.id);
			return json({ error: 'Gagal membuat role user' }, { status: 500 });
		}

		return json({
			id: data.user.id,
			email: data.user.email,
			role,
			created_at: data.user.created_at
		});
	} catch (error) {
		console.error('Create user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
