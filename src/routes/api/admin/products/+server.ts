// src/routes/api/admin/products/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			name,
			description,
			detail_description,
			price,
			stock,
			discount_percentage,
			discount_end_date,
			images
		} = body;

		console.log('Received POST request:', body);

		// Validasi input
		if (!name || !description || price === undefined || stock === undefined) {
			return json({ error: 'Field wajib harus diisi' }, { status: 400 });
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

		const stockNumber = parseInt(stock.toString());
		if (isNaN(stockNumber) || stockNumber < 0) {
			return json({ error: 'Stok tidak boleh negatif' }, { status: 400 });
		}

		const discountNumber = discount_percentage ? parseInt(discount_percentage.toString()) : 0;
		if (discountNumber < 0 || discountNumber > 100) {
			return json({ error: 'Diskon harus antara 0-100%' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Generate ID unik
		const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

		console.log('Inserting product with ID:', id);

		const { data, error } = await supabaseAdmin
			.from('products')
			.insert({
				id,
				name: name.trim(),
				description: description.trim(),
				detail_description: detail_description?.trim() || description.trim(),
				price: priceNumber,
				stock: stockNumber,
				discount_percentage: discountNumber,
				discount_end_date: discount_end_date || null,
				images: images || []
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
			.select('*')
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
