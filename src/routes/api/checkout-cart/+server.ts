import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { pakasir, type PaymentMethod } from '$lib/server/pakasir';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { cart_items, order_id, payment_method = 'qris', user_id } = body;

		if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
			return json({ error: 'Cart items required' }, { status: 400 });
		}

		if (!order_id || typeof order_id !== 'string') {
			return json({ error: 'Invalid order_id' }, { status: 400 });
		}

		if (!user_id || typeof user_id !== 'string') {
			return json({ error: 'User ID required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		let calculatedTotal = 0;
		const productIds = cart_items.map((item: any) => item.product_id);

		const { data: products, error: productsError } = await supabaseAdmin
			.from('products')
			.select('id, price, stock')
			.in('id', productIds);

		if (productsError || !products) {
			return json({ error: 'Failed to fetch products' }, { status: 500 });
		}

		for (const item of cart_items) {
			const product = products.find((p) => p.id === item.product_id);
			if (!product) {
				return json({ error: `Product ${item.product_id} not found` }, { status: 404 });
			}

			if (product.stock < item.quantity) {
				return json(
					{ error: `Insufficient stock for product ${item.product_id}` },
					{ status: 400 }
				);
			}

			calculatedTotal += product.price * item.quantity;
		}

		// Create payment via Pakasir
		console.log('Creating cart payment via Pakasir:', {
			order_id,
			calculatedTotal,
			payment_method
		});
		const payment = await pakasir.createTransaction(
			order_id,
			calculatedTotal,
			payment_method as PaymentMethod
		);

		console.log('Payment created:', payment);

		// Insert transactions with payment info
		const transactionInserts = cart_items.map((item: any) => {
			const product = products.find((p) => p.id === item.product_id);
			return {
				order_id: order_id,
				product_id: item.product_id,
				amount: product!.price * item.quantity,
				status: 'pending',
				user_id,
				payment_method: payment.payment_method,
				payment_number: payment.payment_number,
				fee: payment.fee,
				total_payment: payment.total_payment,
				expired_at: payment.expired_at
			};
		});

		const { error: insertError } = await supabaseAdmin
			.from('transactions')
			.insert(transactionInserts);

		if (insertError) {
			console.error('Failed to insert transactions:', insertError);
			return json({ error: 'Failed to create transactions' }, { status: 500 });
		}
		const noteInserts = cart_items
			.filter((item: any) => item.note && item.note.trim())
			.map((item: any) => ({
				order_id: order_id,
				product_id: item.product_id,
				note: item.note.trim()
			}));

		console.log('Inserting notes:', noteInserts);

		if (noteInserts.length > 0) {
			const { error: noteError } = await supabaseAdmin
				.from('transaction_notes')
				.insert(noteInserts);

			if (noteError) {
				console.error('Failed to save transaction notes:', noteError);
			} else {
				console.log('Transaction notes saved successfully');
			}
		}

		if (noteInserts.length > 0) {
			await supabaseAdmin.from('transaction_notes').insert(noteInserts);
		}

		return json({
			order_id: payment.order_id,
			amount: calculatedTotal,
			fee: payment.fee,
			total_payment: payment.total_payment,
			payment_method: payment.payment_method,
			payment_number: payment.payment_number,
			expired_at: payment.expired_at
		});
	} catch (error) {
		console.error('Checkout cart error:', error);
		return json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
