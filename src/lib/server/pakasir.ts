// src/lib/server/pakasir.ts
const PAKASIR_BASE = 'https://app.pakasir.com';

// ✅ NEVER read env vars at top level
function getEnv() {
	const SLUG = import.meta.env.PAKASIR_SLUG;
	const API_KEY = import.meta.env.PAKASIR_API_KEY;
	const IS_PROD = import.meta.env.IS_PRODUCTION === 'true';

	if (!SLUG || !API_KEY) {
		throw new Error(
			'Missing Pakasir environment variables. Set PAKASIR_SLUG and PAKASIR_API_KEY in Cloudflare Pages > Environment Variables.'
		);
	}

	return { SLUG, API_KEY, IS_PROD };
}

export const pakasir = {
	getPaymentUrl(orderId: string, amount: number, successUrl: string): string {
		const { SLUG } = getEnv(); // ✅ Only read at request time
		const baseUrl = `${PAKASIR_BASE}/pay/${SLUG}/${amount}`;
		const params = new URLSearchParams({
			order_id: orderId,
			redirect: successUrl
		});
		return `${baseUrl}?${params.toString()}`;
	},

	async simulatePayment(orderId: string, amount: number): Promise<void> {
		const { SLUG, API_KEY, IS_PROD } = getEnv();

		if (IS_PROD) return;

		const res = await fetch(`${PAKASIR_BASE}/api/paymentsimulation`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project: SLUG, order_id: orderId, amount, api_key: API_KEY })
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Pakasir simulation failed: ${res.status} ${text}`);
		}
	}
};
