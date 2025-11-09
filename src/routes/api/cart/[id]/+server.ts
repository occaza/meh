// src/routes/api/cart/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

// PUT - Update quantity
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { quantity } = body;

		if (!id || !quantity || quantity < 1) {
			return json({ error: 'Invalid parameters' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Get cart item untuk cek stock
		const { data: cartItem } = await supabaseAdmin
			.from('carts')
			.select('product_id')
			.eq('id', id)
			.single();

		if (!cartItem) {
			return json({ error: 'Cart item not found' }, { status: 404 });
		}

		// Cek stock
		const { data: product } = await supabaseAdmin
			.from('products')
			.select('stock')
			.eq('id', cartItem.product_id)
			.single();

		if (!product || product.stock < quantity) {
			return json({ error: 'Insufficient stock' }, { status: 400 });
		}

		const { error } = await supabaseAdmin
			.from('carts')
			.update({
				quantity,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) {
			return json({ error: 'Failed to update cart' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Update cart error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE - Remove item
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Cart item ID required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { error } = await supabaseAdmin.from('carts').delete().eq('id', id);

		if (error) {
			return json({ error: 'Failed to remove item' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Remove cart item error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
