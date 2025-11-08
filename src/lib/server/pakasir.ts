const PAKASIR_BASE = 'https://app.pakasir.com';
const SLUG = import.meta.env.PAKASIR_SLUG;
const API_KEY = import.meta.env.PAKASIR_API_KEY;
const IS_PROD = import.meta.env.IS_PRODUCTION === 'true';

if (!SLUG || !API_KEY) {
	throw new Error('Missing Pakasir credentials');
}

export const pakasir = {
	// Redirect URL (for frontend redirect)
	getPaymentUrl(orderId: string, amount: number, successUrl: string): string {
		const baseUrl = `${PAKASIR_BASE}/pay/${SLUG}/${amount}`;
		const params = new URLSearchParams({
			order_id: orderId,
			redirect: successUrl
		});
		return `${baseUrl}?${params.toString()}`;
	},

	// Optional: Simulate payment in sandbox (for testing)
	async simulatePayment(orderId: string, amount: number): Promise<void> {
		if (IS_PROD) return; // Never simulate in prod

		const res = await fetch(`${PAKASIR_BASE}/api/paymentsimulation`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project: SLUG, order_id: orderId, amount, api_key: API_KEY })
		});

		if (!res.ok) {
			throw new Error('Failed to simulate payment');
		}
	}
};
