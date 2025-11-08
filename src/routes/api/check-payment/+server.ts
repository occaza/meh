// src/routes/api/check-payment/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { order_id } = body;

		if (!order_id) {
			return json({ error: 'Missing order_id' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('transactions')
			.select('status, amount, completed_at')
			.eq('order_id', order_id)
			.single();

		if (error || !data) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		return json(data);
	} catch (error) {
		console.error('Check payment error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
