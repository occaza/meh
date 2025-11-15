import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const supabaseAdmin = getSupabaseAdmin();

		const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

		if (authError) {
			console.error('List users error:', authError);
			return json({ error: 'Gagal memuat daftar user' }, { status: 500 });
		}

		const { data: userRoles, error: rolesError } = await supabaseAdmin
			.from('user_roles')
			.select('user_id, role, full_name, phone_number');

		if (rolesError) {
			console.error('Get roles error:', rolesError);
		}

		const roleMap = new Map(
			userRoles?.map((r) => [
				r.user_id,
				{ role: r.role, full_name: r.full_name, phone_number: r.phone_number }
			]) || []
		);

		// Filter: jangan tampilkan superadmin
		const users = authUsers.users
			.map((user) => {
				const roleData = roleMap.get(user.id);
				return {
					id: user.id,
					email: user.email,
					role: roleData?.role || 'user',
					full_name: roleData?.full_name || user.user_metadata?.full_name || null,
					phone_number: roleData?.phone_number || user.user_metadata?.phone_number || null,
					created_at: user.created_at,
					last_sign_in_at: user.last_sign_in_at,
					confirmed_at: user.confirmed_at
				};
			})
			.filter((user) => user.role !== 'superadmin');

		return json(users);
	} catch (error) {
		console.error('Get users error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const body = await request.json();
		const { email, password, full_name, phone_number } = body;

		if (!email || !password) {
			return json({ error: 'Email dan password harus diisi' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password minimal 6 karakter' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				full_name: full_name || '',
				phone_number: phone_number || ''
			}
		});

		if (error) {
			console.error('Create user error:', error);
			return json({ error: error.message || 'Gagal membuat user' }, { status: 400 });
		}

		// Role default: user
		const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
			user_id: data.user.id,
			role: 'user',
			full_name: full_name || null,
			phone_number: phone_number || null
		});

		if (roleError) {
			console.error('Insert role error:', roleError);
			await supabaseAdmin.auth.admin.deleteUser(data.user.id);
			return json({ error: 'Gagal membuat role user' }, { status: 500 });
		}

		return json({
			id: data.user.id,
			email: data.user.email,
			role: 'user',
			full_name: full_name || null,
			phone_number: phone_number || null,
			created_at: data.user.created_at
		});
	} catch (error) {
		console.error('Create user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
