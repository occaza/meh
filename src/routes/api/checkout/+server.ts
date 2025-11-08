import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { pakasir } from '$lib/server/pakasir';

export async function POST({ request, url }) {
	const { product_id, order_id } = await request.json();

	if (!product_id || !order_id) {
		return json({ error: 'Missing fields' }, { status: 400 });
	}

	// 1. Fetch product to get price (amount)
	const { data: product, error: productError } = await supabaseAdmin
		.from('products')
		.select('price')
		.eq('id', product_id)
		.single();

	if (productError || !product) {
		return json({ error: 'Product not found' }, { status: 404 });
	}

	const amount = product.price; // ✅ Now `amount` is defined

	// 2. Check if transaction already exists (idempotency)
	const { data: existing, error: fetchError } = await supabaseAdmin
		.from('transactions')
		.select('order_id')
		.eq('order_id', order_id)
		.single();

	if (fetchError && fetchError.code !== 'PGRST116') {
		console.error('DB fetch error:', fetchError);
		return json({ error: 'Failed to check transaction' }, { status: 500 });
	}

	// Only insert if it's truly new
	if (!existing) {
		const { error: insertError } = await supabaseAdmin.from('transactions').insert({
			order_id,
			product_id,
			amount, // ✅ now available
			status: 'pending'
		});

		if (insertError) {
			console.error('DB insert error:', insertError);
			return json({ error: 'Failed to create transaction' }, { status: 500 });
		}
	}

	// 3. Generate redirect URL
	const successUrl = `${url.origin}/success?order_id=${encodeURIComponent(order_id)}`;
	const redirectUrl = pakasir.getPaymentUrl(order_id, amount, successUrl);

	return json({ redirectUrl });
}
