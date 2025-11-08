import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function GET({ params }) {
	const { order_id } = params;

	const { data, error } = await supabaseAdmin
		.from('transactions')
		.select('status, amount, completed_at')
		.eq('order_id', order_id)
		.single();

	if (error || !data) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	return json(data);
}
