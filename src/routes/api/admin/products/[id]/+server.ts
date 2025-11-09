// src/routes/api/admin/products/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Product ID is required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();

		if (error || !data) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		return json(data);
	} catch (error) {
		console.error('Get product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { name, description, price } = body;

		if (!id) {
			return json({ error: 'Product ID is required' }, { status: 400 });
		}

		if (!name || !description || price === undefined) {
			return json({ error: 'Semua field harus diisi' }, { status: 400 });
		}

		if (price <= 0) {
			return json({ error: 'Harga harus lebih dari 0' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('products')
			.update({ name, description, price: parseInt(price.toString()) })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			console.error('Update product error:', error);
			return json({ error: 'Gagal mengupdate produk' }, { status: 500 });
		}

		return json(data);
	} catch (error) {
		console.error('Update product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Product ID is required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

		if (error) {
			console.error('Delete product error:', error);
			return json({ error: 'Gagal menghapus produk' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Delete product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
