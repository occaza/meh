// src/routes/api/admin/coupons/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET - List all coupons
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('coupons')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Get coupons error:', error);
			return json({ error: 'Failed to fetch coupons' }, { status: 500 });
		}

		return json(data || []);
	} catch (error) {
		console.error('Get coupons error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST - Create new coupon
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const body = await request.json();
		const {
			code,
			name,
			description,
			discount_type,
			discount_value,
			min_purchase = 0,
			max_discount,
			usage_limit,
			valid_from,
			valid_until
		} = body;

		// Validasi
		if (!code || !name || !discount_type || !discount_value) {
			return json({ error: 'Field wajib harus diisi' }, { status: 400 });
		}

		if (!['percentage', 'fixed'].includes(discount_type)) {
			return json({ error: 'Tipe diskon tidak valid' }, { status: 400 });
		}

		if (discount_value <= 0) {
			return json({ error: 'Nilai diskon harus lebih dari 0' }, { status: 400 });
		}

		if (discount_type === 'percentage' && discount_value > 100) {
			return json({ error: 'Persentase diskon maksimal 100%' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Cek apakah kode sudah ada
		const { data: existing } = await supabaseAdmin
			.from('coupons')
			.select('id')
			.eq('code', code.toUpperCase())
			.single();

		if (existing) {
			return json({ error: 'Kode kupon sudah digunakan' }, { status: 400 });
		}

		// Insert coupon
		const { data, error } = await supabaseAdmin
			.from('coupons')
			.insert({
				code: code.toUpperCase(),
				name,
				description,
				discount_type,
				discount_value: parseInt(discount_value),
				min_purchase: parseInt(min_purchase) || 0,
				max_discount: max_discount ? parseInt(max_discount) : null,
				usage_limit: usage_limit ? parseInt(usage_limit) : null,
				valid_from: valid_from || new Date().toISOString(),
				valid_until: valid_until || null
			})
			.select()
			.single();

		if (error) {
			console.error('Create coupon error:', error);
			return json({ error: 'Gagal membuat kupon' }, { status: 500 });
		}

		return json(data, { status: 201 });
	} catch (error) {
		console.error('Create coupon error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
