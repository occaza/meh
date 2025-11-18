// src/routes/api/admin/stats/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const supabaseAdmin = getSupabaseAdmin();

		// Total produk
		const { count: totalProducts } = await supabaseAdmin
			.from('products')
			.select('*', { count: 'exact', head: true });

		// Ambil SEMUA transaksi
		const { data: allTransactions } = await supabaseAdmin
			.from('transactions')
			.select('order_id, amount, status');

		if (!allTransactions || allTransactions.length === 0) {
			return json({
				totalProducts: totalProducts || 0,
				totalTransactions: 0,
				completedTransactions: 0,
				processingTransactions: 0,
				pendingTransactions: 0,
				totalRevenue: 0
			});
		}

		// Group by order_id (SAMA seperti di halaman transaksi)
		const groupedOrders = new Map<string, { status: string; total_amount: number }>();

		allTransactions.forEach((transaction) => {
			const existing = groupedOrders.get(transaction.order_id);

			if (existing) {
				// Jika order_id sudah ada, tambahkan amount
				existing.total_amount += transaction.amount;
			} else {
				// Jika order_id baru, buat entry baru
				groupedOrders.set(transaction.order_id, {
					status: transaction.status,
					total_amount: transaction.amount
				});
			}
		});

		// Konversi Map ke Array
		const ordersArray = Array.from(groupedOrders.values());

		// Hitung statistik berdasarkan UNIQUE order_id
		const totalTransactions = ordersArray.length;
		const completedTransactions = ordersArray.filter((o) => o.status === 'completed').length;
		const processingTransactions = ordersArray.filter((o) => o.status === 'processing').length;
		const pendingTransactions = ordersArray.filter((o) => o.status === 'pending').length;

		// Total revenue HANYA dari order completed
		const totalRevenue = ordersArray
			.filter((o) => o.status === 'completed')
			.reduce((sum, order) => sum + order.total_amount, 0);

		console.log('Stats calculation:', {
			totalTransactions,
			completedTransactions,
			processingTransactions,
			pendingTransactions,
			totalRevenue
		});

		return json({
			totalProducts: totalProducts || 0,
			totalTransactions,
			completedTransactions,
			processingTransactions,
			pendingTransactions,
			totalRevenue
		});
	} catch (error) {
		console.error('Failed to fetch stats:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
