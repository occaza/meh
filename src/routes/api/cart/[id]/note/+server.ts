import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { note } = body;

		console.log('Update note request:', { cart_id: id, note });

		if (!id) {
			return json({ error: 'Cart item ID required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data: existing } = await supabaseAdmin
			.from('cart_notes')
			.select('id')
			.eq('cart_id', id)
			.single();

		if (existing) {
			const { error } = await supabaseAdmin
				.from('cart_notes')
				.update({
					note: note?.trim() || null,
					updated_at: new Date().toISOString()
				})
				.eq('cart_id', id);

			if (error) {
				console.error('Update note error:', error);
				return json({ error: 'Failed to update note' }, { status: 500 });
			}

			console.log('Note updated successfully');
		} else {
			if (!note?.trim()) {
				return json({ success: true });
			}

			const { error } = await supabaseAdmin.from('cart_notes').insert({
				cart_id: id,
				note: note.trim()
			});

			if (error) {
				console.error('Insert note error:', error);
				return json({ error: 'Failed to add note' }, { status: 500 });
			}

			console.log('Note created successfully');
		}

		return json({ success: true });
	} catch (error) {
		console.error('Update cart note error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
