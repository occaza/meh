// src/routes/api/coupons/apply/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { validateCoupon, calculateDiscount } from '$lib/utils/coupon.utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { code, total_amount, user_id } = body;

		if (!code || !total_amount || !user_id) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Get coupon by code
		const { data: coupon, error: couponError } = await supabaseAdmin
			.from('coupons')
			.select('*')
			.eq('code', code.toUpperCase())
			.single();

		if (couponError || !coupon) {
			return json({ message: 'Kupon tidak ditemukan' }, { status: 404 });
		}

		// Validate coupon
		const validation = validateCoupon(coupon, total_amount, user_id);
		if (!validation.valid) {
			return json({ message: validation.message }, { status: 400 });
		}

		// Calculate discount
		const discountAmount = calculateDiscount(coupon, total_amount);
		const finalAmount = total_amount - discountAmount;

		return json({
			coupon,
			discount_amount: discountAmount,
			final_amount: finalAmount,
			message: 'Kupon berhasil diterapkan'
		});
	} catch (error) {
		console.error('Apply coupon error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
