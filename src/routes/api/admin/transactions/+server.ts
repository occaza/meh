// src/routes/api/admin/transactions/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('transactions')
			.select(
				`
				order_id,
				amount,
				status,
				payment_method,
				completed_at,
				created_at,
				user_id,
				product:products (
					name
				)
			`
			)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Fetch transactions error:', error);
			return json({ error: 'Failed to fetch transactions' }, { status: 500 });
		}

		// Get user info untuk semua transaksi
		const userIds = [...new Set((data || []).map((t) => t.user_id))];
		const { data: userRoles } = await supabaseAdmin
			.from('user_roles')
			.select('user_id, full_name')
			.in('user_id', userIds);

		const userMap = new Map(userRoles?.map((u) => [u.user_id, u.full_name]) || []);

		// Tambahkan nama pembeli ke setiap transaksi
		const transactionsWithBuyer = (data || []).map((t) => ({
			...t,
			buyer_name: userMap.get(t.user_id) || 'Unknown'
		}));

		return json(transactionsWithBuyer);
	} catch (error) {
		console.error('Get transactions error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
