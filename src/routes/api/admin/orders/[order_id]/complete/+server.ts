import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, cookies }) => {
	try {
		const user = await requireRole(cookies, ['admin', 'superadmin']);
		const { order_id } = params;

		const supabaseAdmin = getSupabaseAdmin();

		// Update status ke completed
		const { data: updated, error: updateErr } = await supabaseAdmin
			.from('transactions')
			.update({
				status: 'completed',
				completed_at: new Date().toISOString(),
				processed_by: user.id
			})
			.eq('order_id', order_id)
			.eq('status', 'processing')
			.select('product_id, amount');

		if (updateErr) {
			console.error('Update order error:', updateErr);
			return json({ error: 'Failed to complete order' }, { status: 500 });
		}

		if (!updated || updated.length === 0) {
			return json({ error: 'Order not found or already completed' }, { status: 404 });
		}

		// Kurangi stok di sini
		for (const transaction of updated) {
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

				console.log(`✅ Stock reduced for ${transaction.product_id}: ${quantity} units`);
			}
		}

		console.log(`✅ Order ${order_id} completed by ${user.email}`);

		return json({ success: true });
	} catch (error) {
		console.error('Complete order error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
