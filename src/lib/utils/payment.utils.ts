// src/lib/utils/payment.utils.ts

export function formatPaymentMethod(method: string | undefined): string {
	if (!method) return '-';

	const methodMap: Record<string, string> = {
		qris: 'QRIS',
		bni_va: 'VA BNI',
		bri_va: 'VA BRI',
		cimb_niaga_va: 'VA CIMB Niaga',
		permata_va: 'VA Permata',
		sampoerna_va: 'VA Sampoerna',
		maybank_va: 'VA Maybank',
		bnc_va: 'VA BNC',
		atm_bersama_va: 'ATM Bersama',
		artha_graha_va: 'VA Artha Graha',
		retail: 'Retail (Indomaret/Alfamart)'
	};

	return methodMap[method] || method.replace(/_/g, ' ').toUpperCase();
}
