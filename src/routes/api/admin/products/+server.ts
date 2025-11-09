// src/routes/api/admin/products/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

// Handler untuk menambah produk baru
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, description, price } = body;

		console.log('Received POST request:', { name, description, price });

		// Validasi input
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

		// Generate ID unik
		const id = `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		console.log('Inserting product with ID:', id);

		const { data, error } = await supabaseAdmin
			.from('products')
			.insert({
				id,
				name: name.trim(),
				description: description.trim(),
				price: priceNumber
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

// Handler untuk mendapatkan semua produk (optional, sudah ada di /api/products)
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
