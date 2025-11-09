// src/routes/api/admin/transactions/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('transactions')
			.select(
				`
				order_id,
				amount,
				status,
				payment_method,
				completed_at,
				created_at,
				product:products (
					name
				)
			`
			)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Fetch transactions error:', error);
			return json({ error: 'Failed to fetch transactions' }, { status: 500 });
		}

		return json(data || []);
	} catch (error) {
		console.error('Get transactions error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
