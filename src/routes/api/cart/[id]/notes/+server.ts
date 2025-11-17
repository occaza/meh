import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

// Update note untuk cart item
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { note } = body;

		if (!id) {
			return json({ error: 'Cart item ID required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Cek apakah note sudah ada
		const { data: existing } = await supabaseAdmin
			.from('cart_notes')
			.select('id')
			.eq('cart_id', id)
			.single();

		if (existing) {
			// Update existing note
			const { error } = await supabaseAdmin
				.from('cart_notes')
				.update({
					note: note || null,
					updated_at: new Date().toISOString()
				})
				.eq('cart_id', id);

			if (error) {
				return json({ error: 'Failed to update note' }, { status: 500 });
			}
		} else {
			// Insert new note
			const { error } = await supabaseAdmin.from('cart_notes').insert({
				cart_id: id,
				note: note || null
			});

			if (error) {
				return json({ error: 'Failed to add note' }, { status: 500 });
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Update cart note error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
