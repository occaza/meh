// src/routes/api/admin/transactions/[order_id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { order_id } = params;

		if (!order_id) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

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
				products (
					name,
					description,
					price
				)
			`
			)
			.eq('order_id', order_id)
			.single();

		if (error || !data) {
			console.error('Fetch transaction error:', error);
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		return json(data);
	} catch (error) {
		console.error('Get transaction detail error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
