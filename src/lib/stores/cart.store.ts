// src/lib/stores/cart.store.ts
import { writable, derived, get } from 'svelte/store';
import type { CartItem, Product } from '$lib/types/types';

function createCartStore() {
	const { subscribe, set, update } = writable<CartItem[]>([]);

	// Generate atau ambil user_id dari localStorage
	function getUserId(): string {
		let userId = localStorage.getItem('cart_user_id');
		if (!userId) {
			userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			localStorage.setItem('cart_user_id', userId);
		}
		return userId;
	}

	return {
		subscribe,

		// Load cart dari server
		async load() {
			try {
				const userId = getUserId();
				const res = await fetch(`/api/cart?user_id=${userId}`);
				if (res.ok) {
					const data = await res.json();
					set(data);
				}
			} catch (error) {
				console.error('Failed to load cart:', error);
			}
		},

		// Tambah item ke cart
		async addItem(product: Product, quantity: number = 1) {
			try {
				const userId = getUserId();
				const res = await fetch('/api/cart', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						user_id: userId,
						product_id: product.id,
						quantity
					})
				});

				if (res.ok) {
					await this.load();
					return true;
				}
				return false;
			} catch (error) {
				console.error('Failed to add to cart:', error);
				return false;
			}
		},

		// Update quantity
		async updateQuantity(cartItemId: string, quantity: number) {
			try {
				const res = await fetch(`/api/cart/${cartItemId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ quantity })
				});

				if (res.ok) {
					await this.load();
					return true;
				}
				return false;
			} catch (error) {
				console.error('Failed to update cart:', error);
				return false;
			}
		},

		// Hapus item dari cart
		async removeItem(cartItemId: string) {
			try {
				const res = await fetch(`/api/cart/${cartItemId}`, {
					method: 'DELETE'
				});

				if (res.ok) {
					await this.load();
					return true;
				}
				return false;
			} catch (error) {
				console.error('Failed to remove from cart:', error);
				return false;
			}
		},

		// Clear cart
		async clear() {
			try {
				const userId = getUserId();
				const res = await fetch(`/api/cart/clear?user_id=${userId}`, {
					method: 'DELETE'
				});

				if (res.ok) {
					set([]);
					return true;
				}
				return false;
			} catch (error) {
				console.error('Failed to clear cart:', error);
				return false;
			}
		}
	};
}

export const cartStore = createCartStore();

// Derived stores untuk computed values
export const cartCount = derived(cartStore, ($cart) =>
	$cart.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = derived(cartStore, ($cart) => {
	return $cart.reduce((sum, item) => {
		if (item.product) {
			const price = item.product.price;
			return sum + price * item.quantity;
		}
		return sum;
	}, 0);
});
