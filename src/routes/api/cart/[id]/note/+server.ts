import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { note } = body;

		console.log('=== UPDATE NOTE DEBUG ===');
		console.log('Cart ID:', id);
		console.log('Note:', note);

		if (!id) {
			return json({ error: 'Cart item ID required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Cek apakah cart item ada
		const { data: cartItem } = await supabaseAdmin.from('carts').select('id').eq('id', id).single();

		console.log('Cart item exists:', !!cartItem);

		if (!cartItem) {
			return json({ error: 'Cart item not found' }, { status: 404 });
		}

		const { data: existing } = await supabaseAdmin
			.from('cart_notes')
			.select('id')
			.eq('cart_id', id)
			.single();

		console.log('Existing note:', existing);

		if (existing) {
			const { error, data: updated } = await supabaseAdmin
				.from('cart_notes')
				.update({
					note: note?.trim() || null,
					updated_at: new Date().toISOString()
				})
				.eq('cart_id', id)
				.select();

			console.log('Update result:', { error, updated });

			if (error) {
				console.error('Update note error:', error);
				return json({ error: 'Failed to update note' }, { status: 500 });
			}
		} else {
			if (!note?.trim()) {
				return json({ success: true });
			}

			const { error, data: inserted } = await supabaseAdmin
				.from('cart_notes')
				.insert({
					cart_id: id,
					note: note.trim()
				})
				.select();

			console.log('Insert result:', { error, inserted });

			if (error) {
				console.error('Insert note error:', error);
				return json({ error: 'Failed to add note' }, { status: 500 });
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Update cart note error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
