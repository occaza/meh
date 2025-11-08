import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { pakasir } from '$lib/server/pakasir';

export async function POST({ request, url }) {
	// --- 1. Parse & validate input ---
	const body = await request.json();

	const { product_id, order_id } = body;

	if (!product_id || typeof product_id !== 'string') {
		return json({ error: 'Invalid or missing product_id' }, { status: 400 });
	}

	if (!order_id || typeof order_id !== 'string') {
		return json({ error: 'Invalid or missing order_id' }, { status: 400 });
	}

	// Optional: validate order_id format (alphanumeric + safe chars)
	if (!/^[a-zA-Z0-9_-]{5,100}$/.test(order_id)) {
		return json({ error: 'order_id must be 5–100 alphanumeric characters' }, { status: 400 });
	}

	// --- 2. Fetch product from Supabase ---
	const supabaseAdmin = getSupabaseAdmin();

	const { data: product, error: productError } = await supabaseAdmin
		.from('products')
		.select('price')
		.eq('id', product_id)
		.single();

	if (productError || !product) {
		return json({ error: 'Product not found' }, { status: 404 });
	}

	const amount = product.price;

	// Validate amount is a safe positive integer (in IDR)
	if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) {
		return json({ error: 'Invalid product price' }, { status: 500 });
	}

	// --- 3. Check if transaction already exists (idempotency) ---
	const { data: existing, error: fetchError } = await supabaseAdmin
		.from('transactions')
		.select('order_id')
		.eq('order_id', order_id)
		.single();

	if (fetchError && fetchError.code !== 'PGRST116') {
		// PGRST116 = "No rows returned" → expected for new orders
		console.error('Supabase fetch error:', fetchError);
		return json({ error: 'Failed to check existing transaction' }, { status: 500 });
	}

	// --- 4. Create new transaction if needed ---
	if (fetchError?.code === 'PGRST116') {
		// No existing transaction → create one
		const { error: insertError } = await supabaseAdmin.from('transactions').insert({
			order_id,
			product_id,
			amount,
			status: 'pending'
		});

		if (insertError) {
			console.error('Failed to insert transaction:', insertError);
			return json({ error: 'Failed to create transaction' }, { status: 500 });
		}
	}

	// If transaction already exists, proceed idempotently (safe retry)

	// --- 5. Generate Pakasir redirect URL ---
	const successUrl = `${url.origin}/success?order_id=${encodeURIComponent(order_id)}`;
	const redirectUrl = pakasir.getPaymentUrl(order_id, amount, successUrl);

	// Optional: log for debugging (remove in high-volume prod if needed)
	console.log('Payment initiated', { order_id, amount, redirectUrl });

	return json({ redirectUrl });
}
