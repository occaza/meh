// src/lib/server/pakasir.ts
import { PAKASIR_SLUG, PAKASIR_API_KEY, IS_PRODUCTION } from '$env/static/private';

const PAKASIR_BASE = 'https://app.pakasir.com';

export type PaymentMethod = 'qris' | 'va_bca' | 'va_bri' | 'va_bni' | 'va_mandiri';

function getEnv() {
	if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
		throw new Error(
			'Missing Pakasir credentials!\n\n' +
				'Create .env file with:\n' +
				'PAKASIR_SLUG=your-slug\n' +
				'PAKASIR_API_KEY=pak_test_xxxxx'
		);
	}

	return {
		SLUG: PAKASIR_SLUG,
		API_KEY: PAKASIR_API_KEY,
		IS_PROD: IS_PRODUCTION === 'true'
	};
}

export const pakasir = {
	async createTransaction(orderId: string, amount: number, paymentMethod: PaymentMethod) {
		const { SLUG, API_KEY } = getEnv();

		const res = await fetch(`${PAKASIR_BASE}/api/payment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${API_KEY}`
			},
			body: JSON.stringify({
				project: SLUG,
				order_id: orderId,
				amount,
				payment_method: paymentMethod
			})
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Pakasir API failed: ${res.status} ${text}`);
		}

		return await res.json();
	},

	async simulatePayment(orderId: string, amount: number): Promise<void> {
		const { SLUG, API_KEY, IS_PROD } = getEnv();

		if (IS_PROD) return;

		const res = await fetch(`${PAKASIR_BASE}/api/paymentsimulation`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project: SLUG,
				order_id: orderId,
				amount,
				api_key: API_KEY
			})
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Pakasir simulation failed: ${res.status} ${text}`);
		}
	}
};
