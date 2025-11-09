// src/lib/utils/product.utils.ts
import type { Product } from '$lib/types/types';

export function calculateDiscountedPrice(product: Product): number {
	if (!product.discount_percentage || product.discount_percentage === 0) {
		return product.price;
	}

	// Cek apakah discount masih valid
	if (product.discount_end_date) {
		const endDate = new Date(product.discount_end_date);
		const now = new Date();
		if (now > endDate) {
			return product.price;
		}
	}

	const discount = (product.price * product.discount_percentage) / 100;
	return product.price - discount;
}

export function getDiscountAmount(product: Product): number {
	return product.price - calculateDiscountedPrice(product);
}

export function isDiscountActive(product: Product): boolean {
	if (!product.discount_percentage || product.discount_percentage === 0) {
		return false;
	}

	if (product.discount_end_date) {
		const endDate = new Date(product.discount_end_date);
		const now = new Date();
		return now <= endDate;
	}

	return true;
}

export function isInStock(product: Product, quantity: number = 1): boolean {
	return product.stock >= quantity;
}
