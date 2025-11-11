// src/routes/api/admin/coupons/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET - Get single coupon
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		await requireRole(cookies, ['admin', 'superadmin']);

		const { id } = params;
		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin.from('coupons').select('*').eq('id', id).single();

		if (error || !data) {
			return json({ error: 'Coupon not found' }, { status: 404 });
		}

		return json(data);
	} catch (error) {
		console.error('Get coupon error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT - Update coupon
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		await requireRole(cookies, ['admin', 'superadmin']);

		const { id } = params;
		const body = await request.json();
		const {
			name,
			description,
			discount_type,
			discount_value,
			min_purchase,
			max_discount,
			usage_limit,
			valid_from,
			valid_until,
			is_active
		} = body;

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('coupons')
			.update({
				name,
				description,
				discount_type,
				discount_value: parseInt(discount_value),
				min_purchase: parseInt(min_purchase) || 0,
				max_discount: max_discount ? parseInt(max_discount) : null,
				usage_limit: usage_limit ? parseInt(usage_limit) : null,
				valid_from,
				valid_until: valid_until || null,
				is_active
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Update coupon error:', error);
			return json({ error: 'Gagal mengupdate kupon' }, { status: 500 });
		}

		return json(data);
	} catch (error) {
		console.error('Update coupon error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE - Delete coupon
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		await requireRole(cookies, ['admin', 'superadmin']);

		const { id } = params;
		const supabaseAdmin = getSupabaseAdmin();

		const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);

		if (error) {
			console.error('Delete coupon error:', error);
			return json({ error: 'Gagal menghapus kupon' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Delete coupon error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
