// src/routes/api/admin/stats/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const supabaseAdmin = getSupabaseAdmin();

		const { count: totalProducts } = await supabaseAdmin
			.from('products')
			.select('*', { count: 'exact', head: true });

		const { count: totalTransactions } = await supabaseAdmin
			.from('transactions')
			.select('*', { count: 'exact', head: true });

		const { count: completedTransactions } = await supabaseAdmin
			.from('transactions')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'completed');

		const { count: pendingTransactions } = await supabaseAdmin
			.from('transactions')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'pending');

		const { data: completedOrders } = await supabaseAdmin
			.from('transactions')
			.select('amount')
			.eq('status', 'completed');

		const totalRevenue = completedOrders?.reduce((sum, order) => sum + order.amount, 0) || 0;

		return json({
			totalProducts: totalProducts || 0,
			totalTransactions: totalTransactions || 0,
			completedTransactions: completedTransactions || 0,
			pendingTransactions: pendingTransactions || 0,
			totalRevenue
		});
	} catch (error) {
		console.error('Failed to fetch stats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
