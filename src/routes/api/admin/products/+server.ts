// src/routes/api/admin/products/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, description, price } = body;

		if (!name || !description || !price) {
			return json({ error: 'Semua field harus diisi' }, { status: 400 });
		}

		if (price <= 0) {
			return json({ error: 'Harga harus lebih dari 0' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('products')
			.insert({ name, description, price })
			.select()
			.single();

		if (error) {
			console.error('Insert product error:', error);
			return json({ error: 'Gagal menambahkan produk' }, { status: 500 });
		}

		return json(data);
	} catch (error) {
		console.error('Add product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
