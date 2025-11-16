import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const supabaseAdmin = getSupabaseAdmin();

		const { data, error } = await supabaseAdmin
			.from('products')
			.select('id, name, stock')
			.lt('stock', 10)
			.gt('stock', 0)
			.order('stock', { ascending: true });

		if (error) {
			console.error('Get low stock error:', error);
			return json({ error: 'Failed to fetch low stock products' }, { status: 500 });
		}

		return json(data || []);
	} catch (error) {
		console.error('Get low stock error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
