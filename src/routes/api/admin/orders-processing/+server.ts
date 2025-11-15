import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('transactions')
			.select(
				`
				order_id,
				amount,
				payment_method,
				processing_started_at,
				product:products (
					name,
					images
				)
			`
			)
			.eq('status', 'processing')
			.order('processing_started_at', { ascending: true });

		if (error) {
			console.error('Get processing orders error:', error);
			return json({ error: 'Failed to fetch orders' }, { status: 500 });
		}

		// Group by order_id
		const groupedOrders = (data || []).reduce(
			(acc, transaction) => {
				const orderId = transaction.order_id;
				if (!acc[orderId]) {
					acc[orderId] = {
						order_id: orderId,
						payment_method: transaction.payment_method,
						processing_started_at: transaction.processing_started_at,
						items: [],
						total: 0
					};
				}

				acc[orderId].items.push({
					product: transaction.product,
					amount: transaction.amount
				});
				acc[orderId].total += transaction.amount;

				return acc;
			},
			{} as Record<string, any>
		);

		return json(Object.values(groupedOrders));
	} catch (error) {
		console.error('Get processing orders error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
