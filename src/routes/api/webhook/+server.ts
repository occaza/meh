import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const supabaseAdmin = getSupabaseAdmin();
	const body = await request.json();
	const { order_id, amount, status, payment_method } = body;

	console.log('Webhook received:', { order_id, amount, status, payment_method });

	// Hanya update ke 'processing' bukan langsung 'completed'
	if (status !== 'completed') {
		return json({ received: true });
	}

	// Update ke status 'processing' ketika pembayaran sukses
	const { data: updated, error: updateErr } = await supabaseAdmin
		.from('transactions')
		.update({
			status: 'processing', // Ubah ini dari 'completed'
			payment_method,
			completed_at: null, // Belum selesai
			processing_started_at: new Date().toISOString() // Tandai mulai diproses
		})
		.eq('order_id', order_id)
		.eq('status', 'pending')
		.select('product_id, amount');

	if (updateErr) {
		console.error('Failed to update transactions:', updateErr);
		return json({ received: true });
	}

	console.log(`✅ Order ${order_id} moved to PROCESSING status`);

	return json({ received: true });
};
