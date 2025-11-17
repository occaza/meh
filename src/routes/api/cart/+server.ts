// src/routes/api/cart/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

// GET - Load cart items
// Ubah bagian GET handler
export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('user_id');

		if (!userId) {
			return json({ error: 'user_id required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Get cart items dengan notes
		const { data, error } = await supabaseAdmin
			.from('carts')
			.select(
				`
				id,
				user_id,
				product_id,
				quantity,
				created_at,
				updated_at,
				product:products (
					id,
					name,
					price,
					description,
					detail_description,
					images,
					stock,
					discount_percentage,
					discount_end_date
				),
				cart_notes (
					note
				)
			`
			)
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Get cart error:', error);
			return json({ error: 'Failed to load cart' }, { status: 500 });
		}

		// Transform data untuk include note di level cart item
		const transformedData = (data || []).map((item) => ({
			...item,
			note: item.cart_notes?.[0]?.note || null,
			cart_notes: undefined // Remove nested object
		}));

		return json(transformedData);
	} catch (error) {
		console.error('Get cart error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST - Add item to cart
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { user_id, product_id, quantity = 1 } = body;

		if (!user_id || !product_id) {
			return json({ error: 'user_id and product_id required' }, { status: 400 });
		}

		if (quantity < 1) {
			return json({ error: 'Quantity must be at least 1' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Cek stock produk
		const { data: product, error: productError } = await supabaseAdmin
			.from('products')
			.select('stock')
			.eq('id', product_id)
			.single();

		if (productError || !product) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (product.stock < quantity) {
			return json({ error: 'Insufficient stock' }, { status: 400 });
		}

		// Cek apakah produk sudah ada di cart
		const { data: existing } = await supabaseAdmin
			.from('carts')
			.select('id, quantity')
			.eq('user_id', user_id)
			.eq('product_id', product_id)
			.single();

		if (existing) {
			// Update quantity jika sudah ada
			const newQuantity = existing.quantity + quantity;

			if (product.stock < newQuantity) {
				return json({ error: 'Insufficient stock' }, { status: 400 });
			}

			const { error: updateError } = await supabaseAdmin
				.from('carts')
				.update({
					quantity: newQuantity,
					updated_at: new Date().toISOString()
				})
				.eq('id', existing.id);

			if (updateError) {
				return json({ error: 'Failed to update cart' }, { status: 500 });
			}
		} else {
			// Insert baru
			const { error: insertError } = await supabaseAdmin.from('carts').insert({
				user_id,
				product_id,
				quantity
			});

			if (insertError) {
				console.error('Insert cart error:', insertError);
				return json({ error: 'Failed to add to cart' }, { status: 500 });
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Add to cart error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
