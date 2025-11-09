<!-- src/lib/components/products/ProductCard.svelte -->
<script lang="ts">
	import type { Product } from '$lib/types/types';
	import { formatCurrency, formatStock } from '$lib/utils/format.utils';
	import { calculateDiscountedPrice, isDiscountActive, isInStock } from '$lib/utils/product.utils';
	import { cartStore } from '$lib/stores/cart.store';

	type Props = {
		product: Product;
		onBuy?: (product: Product) => void;
		showAddToCart?: boolean;
	};

	let { product, onBuy, showAddToCart = false }: Props = $props();

	let addingToCart = $state(false);

	const hasDiscount = $derived(isDiscountActive(product));
	const finalPrice = $derived(calculateDiscountedPrice(product));
	const inStock = $derived(isInStock(product));
	const productImage = $derived(
		product.images && product.images.length > 0
			? product.images[0]
			: 'https://via.placeholder.com/400x300?text=No+Image'
	);

	async function handleAddToCart() {
		addingToCart = true;
		const success = await cartStore.addItem(product, 1);
		if (success) {
			alert('Produk berhasil ditambahkan ke keranjang!');
		} else {
			alert('Gagal menambahkan ke keranjang');
		}
		addingToCart = false;
	}

	function handleBuyNow() {
		if (onBuy) {
			onBuy(product);
		}
	}
</script>

<div class="card bg-base-100 shadow-xl transition-transform hover:scale-105">
	<!-- Product Image -->
	<figure class="relative h-48 overflow-hidden">
		<img src={productImage} alt={product.name} class="h-full w-full object-cover" />

		<!-- Discount Badge -->
		{#if hasDiscount && product.discount_percentage}
			<div class="absolute top-2 right-2 badge gap-1 font-bold badge-error">
				<span>🔥</span>
				-{product.discount_percentage}%
			</div>
		{/if}

		<!-- Stock Badge -->
		{#if !inStock}
			<div class="absolute bottom-2 left-2 badge badge-ghost bg-black/70 text-white">
				Stok Habis
			</div>
		{/if}
	</figure>

	<div class="card-body">
		<h2 class="card-title">
			{product.name}
			{#if product.stock < 10 && product.stock > 0}
				<span class="badge badge-sm badge-warning">Terbatas!</span>
			{/if}
		</h2>

		<p class="line-clamp-2 text-base-content/70">{product.description}</p>

		<!-- Price Section -->
		<div class="my-2">
			{#if hasDiscount}
				<div class="flex items-center gap-2">
					<span class="text-2xl font-bold text-primary">
						{formatCurrency(finalPrice)}
					</span>
					<span class="text-sm text-base-content/50 line-through">
						{formatCurrency(product.price)}
					</span>
				</div>
			{:else}
				<div class="text-2xl font-bold text-primary">
					{formatCurrency(product.price)}
				</div>
			{/if}

			<!-- Stock Info -->
			<div class="mt-1 text-sm text-base-content/70">
				{formatStock(product.stock)}
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="card-actions justify-end">
			{#if inStock}
				{#if showAddToCart}
					<button class="btn btn-outline btn-sm" onclick={handleAddToCart} disabled={addingToCart}>
						{#if addingToCart}
							<span class="loading loading-xs loading-spinner"></span>
						{:else}
							<span>🛒</span>
						{/if}
						Keranjang
					</button>
				{/if}

				<button class="btn flex-1 btn-sm btn-primary" onclick={handleBuyNow}>
					<span>⚡</span>
					Beli Sekarang
				</button>
			{:else}
				<button class="btn btn-disabled btn-block btn-sm" disabled> Stok Habis </button>
			{/if}
		</div>
	</div>
</div>
