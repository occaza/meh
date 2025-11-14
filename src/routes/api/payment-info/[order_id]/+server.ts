import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { order_id } = params;

		console.log('Payment info request for order:', order_id);

		if (!order_id) {
			return json({ error: 'Order ID required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Get transactions
		const { data: transactions, error } = await supabaseAdmin
			.from('transactions')
			.select('*')
			.eq('order_id', order_id);

		console.log('Transactions found:', transactions?.length || 0);

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: 'Database error' }, { status: 500 });
		}

		if (!transactions || transactions.length === 0) {
			console.error('No transactions found for order:', order_id);
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		const firstTx = transactions[0];
		console.log('First transaction:', firstTx);

		// Check if already completed
		if (firstTx.status === 'completed') {
			return json({ error: 'Payment already completed' }, { status: 400 });
		}

		// Calculate total amount
		const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

		// Return payment info
		const paymentInfo = {
			order_id: order_id,
			amount: totalAmount,
			fee: firstTx.fee || 0,
			total_payment: firstTx.total_payment || totalAmount,
			payment_method: firstTx.payment_method || 'qris',
			payment_number: firstTx.payment_number || '',
			expired_at: firstTx.expired_at || null,
			status: firstTx.status
		};

		console.log('Returning payment info:', paymentInfo);

		return json(paymentInfo);
	} catch (error) {
		console.error('Get payment info error:', error);
		return json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
