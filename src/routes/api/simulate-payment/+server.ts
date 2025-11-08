// src/routes/api/simulate-payment/+server.ts
import { json } from '@sveltejs/kit';
import { pakasir } from '$lib/server/pakasir';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { order_id, amount } = body;

		if (!order_id || !amount) {
			return json({ error: 'Missing order_id or amount' }, { status: 400 });
		}

		await pakasir.simulatePayment(order_id, amount);

		return json({ success: true, message: 'Payment simulated successfully' });
	} catch (error) {
		console.error('Simulate payment error:', error);
		return json(
			{
				error: 'Simulation failed',
				message: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
