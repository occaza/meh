// src/routes/api/admin/products/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import { generateUniqueSlug } from '$lib/utils/slug.utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Hanya superadmin
		await requireRole(cookies, ['superadmin']);

		const body = await request.json();
		const {
			name,
			description,
			price,
			detail_description,
			images,
			stock,
			discount_percentage,
			discount_end_date
		} = body;

		console.log('Received POST request:', { name, description, price });

		if (!name || !description || price === undefined) {
			return json({ error: 'Semua field harus diisi' }, { status: 400 });
		}

		if (typeof name !== 'string' || name.trim() === '') {
			return json({ error: 'Nama produk tidak valid' }, { status: 400 });
		}

		if (typeof description !== 'string' || description.trim() === '') {
			return json({ error: 'Deskripsi tidak valid' }, { status: 400 });
		}

		const priceNumber = parseInt(price.toString());
		if (isNaN(priceNumber) || priceNumber <= 0) {
			return json({ error: 'Harga harus lebih dari 0' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const id = `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const slug = generateUniqueSlug(name, id);

		const { data, error } = await supabaseAdmin
			.from('products')
			.insert({
				id,
				slug,
				name: name.trim(),
				description: description.trim(),
				detail_description: detail_description?.trim() || description.trim(),
				price: priceNumber,
				images: images || [],
				stock: stock !== undefined ? parseInt(stock.toString()) : 0
			})
			.select()
			.single();

		if (error) {
			console.error('Insert product error:', error);
			return json({ error: 'Gagal menambahkan produk: ' + error.message }, { status: 500 });
		}

		console.log('Product created successfully:', data);

		return json(data, { status: 201 });
	} catch (error) {
		console.error('Add product error:', error);
		return json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async () => {
	try {
		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('products')
			.select('id, name, price, description')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Fetch products error:', error);
			return json({ error: 'Failed to fetch products' }, { status: 500 });
		}

		return json(data || []);
	} catch (error) {
		console.error('Get products error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
