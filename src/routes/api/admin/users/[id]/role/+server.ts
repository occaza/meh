// src/routes/api/admin/users/[id]/role/+server.ts
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

		// Cek apakah user adalah superadmin
		const { data: currentRole } = await supabaseAdmin
			.from('user_roles')
			.select('role')
			.eq('user_id', id)
			.single();

		if (currentRole?.role === 'superadmin') {
			return json({ error: 'Tidak bisa mengubah role superadmin' }, { status: 403 });
		}

		// Cek apakah user sudah punya role
		const { data: existing } = await supabaseAdmin
			.from('user_roles')
			.select('id')
			.eq('user_id', id)
			.single();

		if (existing) {
			// Update existing role
			const { error: updateError } = await supabaseAdmin
				.from('user_roles')
				.update({
					role,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', id);

			if (updateError) {
				console.error('Update role error:', updateError);
				return json({ error: 'Gagal update role' }, { status: 500 });
			}
		} else {
			// Insert new role
			const { error: insertError } = await supabaseAdmin.from('user_roles').insert({
				user_id: id,
				role
			});

			if (insertError) {
				console.error('Insert role error:', insertError);
				return json({ error: 'Gagal membuat role' }, { status: 500 });
			}
		}

		return json({ success: true, role });
	} catch (error) {
		console.error('Update user role error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
