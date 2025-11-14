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

		const { data: transactions, error } = await supabaseAdmin
			.from('transactions')
			.select('status, amount, completed_at, product_id')
			.eq('order_id', order_id);

		if (error || !transactions || transactions.length === 0) {
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		const allCompleted = transactions.every((t) => t.status === 'completed');
		const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

		// Jika completed dan ini first time check, kurangi stok
		if (allCompleted) {
			for (const transaction of transactions) {
				const { data: product } = await supabaseAdmin
					.from('products')
					.select('stock, price')
					.eq('id', transaction.product_id)
					.single();

				if (product && product.stock > 0) {
					const quantity = Math.floor(transaction.amount / product.price);

					const { error: stockError } = await supabaseAdmin
						.from('products')
						.update({
							stock: Math.max(0, product.stock - quantity)
						})
						.eq('id', transaction.product_id);

					if (!stockError) {
						console.log(
							`✅ Stock reduced for product ${transaction.product_id}: ${quantity} units`
						);
					}
				}
			}
		}

		return json({
			status: allCompleted ? 'completed' : transactions[0].status,
			amount: totalAmount,
			completed_at: allCompleted ? transactions[0].completed_at : null
		});
	} catch (error) {
		console.error('Check payment error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
