// src/routes/api/admin/transactions/[order_id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { order_id } = params;

		if (!order_id) {
			return json({ error: 'Order ID is required' }, { status: 400 });
		}

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
				product_id,
				user_id,
				products (
					name,
					description,
					price,
					images
				)
			`
			)
			.eq('order_id', order_id)
			.order('created_at', { ascending: true });

		if (error || !data || data.length === 0) {
			console.error('Fetch transaction error:', error);
			return json({ error: 'Transaction not found' }, { status: 404 });
		}

		// Get user info
		const userId = data[0].user_id;
		const { data: userRole } = await supabaseAdmin
			.from('user_roles')
			.select('full_name, phone_number')
			.eq('user_id', userId)
			.single();

		// Get user email
		const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

		// Get notes
		const { data: notes } = await supabaseAdmin
			.from('transaction_notes')
			.select('product_id, note')
			.eq('order_id', order_id);

		const notesMap = new Map(notes?.map((n) => [n.product_id, n.note]) || []);

		const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);

		return json({
			order_id: data[0].order_id,
			total_amount: totalAmount,
			status: data[0].status,
			payment_method: data[0].payment_method,
			completed_at: data[0].completed_at,
			created_at: data[0].created_at,
			buyer: {
				name: userRole?.full_name || 'Unknown',
				email: userData?.user?.email || null,
				phone: userRole?.phone_number || null
			},
			items: data.map((t) => ({
				product: t.products,
				amount: t.amount,
				note: notesMap.get(t.product_id) || null
			}))
		});
	} catch (error) {
		console.error('Get transaction detail error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
