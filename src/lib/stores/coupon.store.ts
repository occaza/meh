// src/lib/stores/coupon.store.ts
import { writable } from 'svelte/store';
import type { Coupon, AppliedCoupon } from '$lib/types/types';

function createCouponStore() {
	const { subscribe, set, update } = writable<AppliedCoupon | null>(null);

	return {
		subscribe,

		async apply(code: string, totalAmount: number, userId: string): Promise<boolean> {
			try {
				const res = await fetch('/api/coupons/apply', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ code, total_amount: totalAmount, user_id: userId })
				});

				const data = await res.json();

				if (res.ok && data.coupon) {
					set({
						coupon: data.coupon,
						discount_amount: data.discount_amount,
						final_amount: data.final_amount
					});
					return true;
				} else {
					alert(data.message || 'Kupon tidak valid');
					return false;
				}
			} catch (error) {
				console.error('Apply coupon error:', error);
				alert('Gagal menerapkan kupon');
				return false;
			}
		},

		remove() {
			set(null);
		},

		clear() {
			set(null);
		}
	};
}

export const appliedCoupon = createCouponStore();
