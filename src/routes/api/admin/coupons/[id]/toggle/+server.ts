// src/routes/api/admin/coupons/[id]/toggle/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const { id } = params;
		const supabaseAdmin = getSupabaseAdmin();

		// Get current status
		const { data: current } = await supabaseAdmin
			.from('coupons')
			.select('is_active')
			.eq('id', id)
			.single();

		if (!current) {
			return json({ error: 'Coupon not found' }, { status: 404 });
		}

		// Toggle status
		const { data, error } = await supabaseAdmin
			.from('coupons')
			.update({ is_active: !current.is_active })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Toggle coupon error:', error);
			return json({ error: 'Gagal mengubah status kupon' }, { status: 500 });
		}

		return json(data);
	} catch (error) {
		console.error('Toggle coupon error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
