<!-- src/routes/cart/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cartStore, cartCount, cartTotal } from '$lib/stores/cart.store';
	import { formatCurrency } from '$lib/utils/format.utils';
	import { calculateDiscountedPrice } from '$lib/utils/product.utils';
	import type { CartItem } from '$lib/types/types';

	let cart = $state<CartItem[]>([]);
	let loading = $state(true);
	let checkoutLoading = $state(false);

	$effect(() => {
		cart = $cartStore;
	});

	onMount(async () => {
		await cartStore.load();
		loading = false;
	});

	async function updateQuantity(item: CartItem, newQuantity: number) {
		if (newQuantity < 1) return;

		const success = await cartStore.updateQuantity(item.id, newQuantity);
		if (!success) {
			alert('Gagal mengupdate jumlah');
		}
	}

	async function removeItem(item: CartItem) {
		if (!confirm(`Hapus ${item.product?.name} dari keranjang?`)) return;

		const success = await cartStore.removeItem(item.id);
		if (!success) {
			alert('Gagal menghapus item');
		}
	}

	async function handleCheckout() {
		if (cart.length === 0) return;

		checkoutLoading = true;

		try {
			// TODO: Implementasi checkout multi-product nanti
			// Untuk sekarang, checkout item pertama
			alert(
				'Fitur checkout multi-product sedang dalam pengembangan. Silakan beli satu per satu untuk sementara.'
			);
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Terjadi kesalahan saat checkout');
		} finally {
			checkoutLoading = false;
		}
	}

	function getItemSubtotal(item: CartItem): number {
		if (!item.product) return 0;
		const price = calculateDiscountedPrice(item.product);
		return price * item.quantity;
	}

	const totalAmount = $derived(cart.reduce((sum, item) => sum + getItemSubtotal(item), 0));
</script>

<div class="min-h-screen bg-base-200">
	<!-- Header/Navbar -->
	<div class="navbar bg-base-100 shadow-lg">
		<div class="container mx-auto">
			<div class="flex-1">
				<a href="/" class="btn text-xl btn-ghost">
					<span class="text-2xl">🛒</span>
					Toko Digital
				</a>
			</div>
			<div class="flex-none gap-2">
				<a href="/shop" class="btn btn-ghost">Belanja</a>
				<a href="/" class="btn btn-ghost">Beranda</a>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold">Keranjang Belanja</h1>
			<p class="text-base-content/70">
				{$cartCount} item dalam keranjang
			</p>
		</div>

		{#if loading}
			<div class="flex justify-center py-20">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if cart.length === 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body items-center text-center">
					<div class="mb-4 text-6xl">🛒</div>
					<h2 class="card-title text-2xl">Keranjang Kosong</h2>
					<p class="text-base-content/70">Belum ada produk di keranjang Anda</p>
					<div class="mt-6 card-actions">
						<a href="/shop" class="btn btn-primary">
							<span>🛍️</span>
							Mulai Belanja
						</a>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<!-- Cart Items -->
				<div class="space-y-4 lg:col-span-2">
					{#each cart as item}
						{#if item.product}
							<div class="card bg-base-100 shadow-xl">
								<div class="card-body">
									<div class="flex gap-4">
										<!-- Product Image -->
										<figure class="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
											<img
												src={item.product.images?.[0] || 'https://via.placeholder.com/200'}
												alt={item.product.name}
												class="h-full w-full object-cover"
											/>
										</figure>

										<!-- Product Info -->
										<div class="flex-1">
											<h3 class="text-lg font-bold">{item.product.name}</h3>
											<p class="line-clamp-1 text-sm text-base-content/70">
												{item.product.description}
											</p>

											<div class="mt-2 flex items-center gap-4">
												<!-- Price -->
												<div>
													{#if item.product.discount_percentage}
														<div class="flex items-center gap-2">
															<span class="font-bold text-primary">
																{formatCurrency(calculateDiscountedPrice(item.product))}
															</span>
															<span class="text-xs text-base-content/50 line-through">
																{formatCurrency(item.product.price)}
															</span>
														</div>
													{:else}
														<span class="font-bold text-primary">
															{formatCurrency(item.product.price)}
														</span>
													{/if}
												</div>

												<!-- Quantity Control -->
												<div class="flex items-center gap-2">
													<button
														class="btn btn-circle btn-sm"
														onclick={() => updateQuantity(item, item.quantity - 1)}
														disabled={item.quantity <= 1}
													>
														−
													</button>
													<span class="w-8 text-center font-semibold">{item.quantity}</span>
													<button
														class="btn btn-circle btn-sm"
														onclick={() => updateQuantity(item, item.quantity + 1)}
														disabled={item.product && item.quantity >= item.product.stock}
													>
														+
													</button>
												</div>
											</div>

											<!-- Stock Warning -->
											{#if item.product.stock < item.quantity}
												<div class="mt-2 alert py-2 alert-warning">
													<span class="text-xs">Stok tidak cukup! Tersisa {item.product.stock}</span
													>
												</div>
											{/if}
										</div>

										<!-- Actions -->
										<div class="flex flex-col justify-between">
											<button
												class="btn btn-circle btn-ghost btn-sm"
												onclick={() => removeItem(item)}
											>
												🗑️
											</button>
											<div class="text-right font-bold">
												{formatCurrency(getItemSubtotal(item))}
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Order Summary -->
				<div class="lg:col-span-1">
					<div class="card sticky top-4 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title">Ringkasan Belanja</h2>

							<div class="divider"></div>

							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span>Subtotal ({$cartCount} item)</span>
									<span>{formatCurrency(totalAmount)}</span>
								</div>

								<!-- Add shipping/admin fee here if needed -->
							</div>

							<div class="divider"></div>

							<div class="flex justify-between text-lg font-bold">
								<span>Total</span>
								<span class="text-primary">{formatCurrency(totalAmount)}</span>
							</div>

							<button
								class="btn mt-4 btn-block btn-primary"
								onclick={handleCheckout}
								disabled={checkoutLoading || cart.length === 0}
							>
								{#if checkoutLoading}
									<span class="loading loading-sm loading-spinner"></span>
									Processing...
								{:else}
									<span>💳</span>
									Checkout
								{/if}
							</button>

							<a href="/shop" class="btn btn-block btn-ghost">
								<span>🛍️</span>
								Lanjut Belanja
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
