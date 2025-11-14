// src/lib/server/pakasir.ts
import { PAKASIR_SLUG, PAKASIR_API_KEY, IS_PRODUCTION } from '$env/static/private';

const PAKASIR_BASE = 'https://app.pakasir.com';

export type PaymentMethod =
	| 'qris'
	| 'bni_va'
	| 'bri_va'
	| 'cimb_niaga_va'
	| 'sampoerna_va'
	| 'bnc_va'
	| 'maybank_va'
	| 'permata_va'
	| 'atm_bersama_va'
	| 'artha_graha_va'
	| 'retail';

function getEnv() {
	if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
		throw new Error('Missing Pakasir credentials!');
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
		const endpoint = `${PAKASIR_BASE}/api/transactioncreate/${paymentMethod}`;

		// console.log('Creating transaction:', { endpoint, orderId, amount, paymentMethod });

		const res = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				project: SLUG,
				order_id: orderId,
				amount,
				api_key: API_KEY
			})
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('Pakasir API error:', res.status, text);
			throw new Error(`Pakasir API failed: ${res.status} ${text}`);
		}

		const data = await res.json();
		// console.log('Pakasir response:', data);

		return data.payment;
	},

	async getTransactionDetail(orderId: string, amount: number) {
		const { SLUG, API_KEY } = getEnv();

		const params = new URLSearchParams({
			project: SLUG,
			order_id: orderId,
			amount: amount.toString(),
			api_key: API_KEY
		});

		const url = `${PAKASIR_BASE}/api/transactiondetail?${params.toString()}`;

		console.log('Fetching transaction detail:', { orderId, amount, url });

		const res = await fetch(url);

		if (!res.ok) {
			const text = await res.text();
			console.error('Pakasir API error:', res.status, text);
			throw new Error(`Failed to get transaction detail: ${res.status} ${text}`);
		}

		const data = await res.json();
		console.log('Pakasir transaction detail response:', JSON.stringify(data, null, 2));

		return data.transaction;
	},

	async simulatePayment(orderId: string, amount: number): Promise<void> {
		const { SLUG, API_KEY, IS_PROD } = getEnv();

		if (IS_PROD) {
			console.log('Skipping payment simulation in production mode');
			return;
		}

		// console.log('Simulating payment for:', orderId);

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

		// console.log('Payment simulation successful');
	}
};
