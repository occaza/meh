// src/routes/api/cart/clear/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('user_id');

		if (!userId) {
			return json({ error: 'user_id required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { error } = await supabaseAdmin.from('carts').delete().eq('user_id', userId);

		if (error) {
			return json({ error: 'Failed to clear cart' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Clear cart error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
