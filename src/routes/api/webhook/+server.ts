import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function POST({ request }) {
	const body = await request.json();

	const { order_id, amount, status, payment_method } = body;

	// Only act on "completed"
	if (status !== 'completed') {
		return json({ received: true });
	}

	// 1. Fetch existing transaction
	const { data: trans, error: fetchErr } = await supabaseAdmin
		.from('transactions')
		.select('amount, status')
		.eq('order_id', order_id)
		.single();

	if (fetchErr || !trans) {
		console.warn('Webhook: Transaction not found', order_id);
		return json({ received: true });
	}

	// 2. Prevent replay or fraud
	if (trans.status === 'completed') return json({ received: true });
	if (trans.amount !== amount) {
		console.error('Amount mismatch!', { order_id, expected: trans.amount, got: amount });
		return json({ received: true });
	}

	// 3. Mark as completed
	const { error: updateErr } = await supabaseAdmin
		.from('transactions')
		.update({
			status: 'completed',
			payment_method,
			completed_at: new Date().toISOString()
		})
		.eq('order_id', order_id);

	if (updateErr) {
		console.error('Failed to update transaction', updateErr);
	}

	// 🔔 Optional: Trigger fulfillment (email, unlock content, etc.)

	return json({ received: true });
}
