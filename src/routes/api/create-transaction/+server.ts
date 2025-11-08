import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function POST({ request }) {
	const { amount, order_id } = await request.json();

	// Save to DB
	const { error } = await supabaseAdmin
		.from('transactions')
		.insert({ order_id, amount, status: 'pending' });

	if (error) {
		return json({ error: 'DB insert failed' }, { status: 500 });
	}

	// Redirect to Pakasir URL (or call API for QR)
	const slug = 'your-pakasir-slug';
	const redirectUrl = `https://app.pakasir.com/pay/${slug}/${amount}?order_id=${order_id}&redirect=${encodeURIComponent('https://your-site.com/success')}`;

	return json({ redirectUrl });
}
