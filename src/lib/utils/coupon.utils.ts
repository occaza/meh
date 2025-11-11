// src/lib/utils/coupon.utils.ts
import type { Coupon } from '$lib/types/types';

export function validateCoupon(
	coupon: Coupon,
	totalAmount: number,
	userId: string
): { valid: boolean; message?: string } {
	// Cek apakah coupon aktif
	if (!coupon.is_active) {
		return { valid: false, message: 'Kupon tidak aktif' };
	}

	// Cek tanggal berlaku
	const now = new Date();
	const validFrom = new Date(coupon.valid_from);

	if (now < validFrom) {
		return { valid: false, message: 'Kupon belum dapat digunakan' };
	}

	// Cek expired
	if (coupon.valid_until) {
		const validUntil = new Date(coupon.valid_until);
		if (now > validUntil) {
			return { valid: false, message: 'Kupon sudah kadaluarsa' };
		}
	}

	// Cek minimum purchase
	if (totalAmount < coupon.min_purchase) {
		return {
			valid: false,
			message: `Minimum pembelian Rp${coupon.min_purchase.toLocaleString('id-ID')}`
		};
	}

	// Cek usage limit
	if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
		return { valid: false, message: 'Kupon sudah mencapai batas penggunaan' };
	}

	return { valid: true };
}

export function calculateDiscount(coupon: Coupon, totalAmount: number): number {
	if (coupon.discount_type === 'fixed') {
		// Diskon nominal tetap
		return Math.min(coupon.discount_value, totalAmount);
	} else {
		// Diskon persentase
		let discount = Math.floor((totalAmount * coupon.discount_value) / 100);

		// Apply max discount jika ada
		if (coupon.max_discount) {
			discount = Math.min(discount, coupon.max_discount);
		}

		return discount;
	}
}

export function formatCouponDiscount(coupon: Coupon): string {
	if (coupon.discount_type === 'fixed') {
		return `Rp${coupon.discount_value.toLocaleString('id-ID')}`;
	} else {
		let text = `${coupon.discount_value}%`;
		if (coupon.max_discount) {
			text += ` (max Rp${coupon.max_discount.toLocaleString('id-ID')})`;
		}
		return text;
	}
}

export function getCouponStatusBadge(coupon: Coupon): string {
	if (!coupon.is_active) return 'badge-ghost';

	const now = new Date();

	if (coupon.valid_until) {
		const validUntil = new Date(coupon.valid_until);
		if (now > validUntil) return 'badge-error';
	}

	if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
		return 'badge-warning';
	}

	return 'badge-success';
}

export function getCouponStatusText(coupon: Coupon): string {
	if (!coupon.is_active) return 'Tidak Aktif';

	const now = new Date();

	if (coupon.valid_until) {
		const validUntil = new Date(coupon.valid_until);
		if (now > validUntil) return 'Kadaluarsa';
	}

	if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
		return 'Habis';
	}

	return 'Aktif';
}
