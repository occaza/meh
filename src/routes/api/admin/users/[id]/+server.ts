// src/routes/api/admin/users/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { role } = body;

		if (!id) {
			return json({ error: 'User ID diperlukan' }, { status: 400 });
		}

		if (!role || !['admin', 'user'].includes(role)) {
			return json({ error: 'Role harus admin atau user' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
			user_metadata: { role }
		});

		if (error) {
			console.error('Update user role error:', error);
			return json({ error: error.message || 'Gagal update role' }, { status: 500 });
		}

		return json({ success: true, role });
	} catch (error) {
		console.error('Update user role error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'User ID diperlukan' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Cek apakah user adalah superadmin
		const { data: userRole } = await supabaseAdmin
			.from('user_roles')
			.select('role')
			.eq('user_id', id)
			.single();

		if (userRole?.role === 'superadmin') {
			return json({ error: 'Tidak bisa menghapus user superadmin' }, { status: 403 });
		}

		const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

		if (error) {
			console.error('Delete user error:', error);
			return json({ error: error.message || 'Gagal menghapus user' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Delete user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
