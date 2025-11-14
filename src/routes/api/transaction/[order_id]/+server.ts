import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const supabaseAdmin = getSupabaseAdmin();
	const { order_id } = params as { order_id: string };

	if (!order_id) {
		return json({ error: 'Missing order_id' }, { status: 400 });
	}

	const { data, error } = await supabaseAdmin
		.from('transactions')
		.select('status, amount, completed_at, payment_method, product_id')
		.eq('order_id', order_id);

	if (error || !data || data.length === 0) {
		return json({ error: 'Transaction not found' }, { status: 404 });
	}

	const allCompleted = data.every((t) => t.status === 'completed');
	const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);

	// Jika completed, kurangi stok
	if (allCompleted) {
		for (const transaction of data) {
			const { data: product } = await supabaseAdmin
				.from('products')
				.select('stock, price')
				.eq('id', transaction.product_id)
				.single();

			if (product && product.stock > 0) {
				const quantity = Math.floor(transaction.amount / product.price);

				await supabaseAdmin
					.from('products')
					.update({
						stock: Math.max(0, product.stock - quantity)
					})
					.eq('id', transaction.product_id);
			}
		}
	}

	return json({
		status: allCompleted ? 'completed' : data[0].status,
		amount: totalAmount,
		completed_at: allCompleted ? data[0].completed_at : null,
		payment_method: data[0].payment_method
	});
};
