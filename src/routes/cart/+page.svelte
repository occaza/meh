<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Navbar,
		cartStore,
		cartCount,
		formatCurrency,
		calculateDiscountedPrice,
		PAYMENT_METHODS,
		MethodSelectorModal,
		PaymentModal
	} from '$lib';
	import { appliedCoupon } from '$lib/stores/coupon.store';
	import type { CartItem } from '$lib/types/types';
	import QRCode from 'qrcode';

	let cart = $state<CartItem[]>([]);
	let selectedItems = $state<Set<string>>(new Set());
	let loading = $state(true);
	let checkoutLoading = $state(false);
	let couponCode = $state('');
	let applyingCoupon = $state(false);
	let showPayment = $state(false);
	let showMethodSelector = $state(false);
	let selectedMethod = $state('qris');
	let paymentData = $state<any>(null);
	let qrImageUrl = $state('');
	let pollingInterval = $state<any>(null);
	let isSimulating = $state(false);

	$effect(() => {
		cart = $cartStore;
	});

	onMount(async () => {
		await cartStore.load();
		loading = false;
	});

	$effect(() => {
		return () => {
			if (pollingInterval) clearInterval(pollingInterval);
		};
	});

	const allSelected = $derived(cart.length > 0 && selectedItems.size === cart.length);

	function toggleSelectAll() {
		if (allSelected) {
			selectedItems = new Set();
		} else {
			selectedItems = new Set(cart.map((item) => item.id));
		}
	}

	function toggleSelectItem(itemId: string) {
		const newSet = new Set(selectedItems);
		if (newSet.has(itemId)) {
			newSet.delete(itemId);
		} else {
			newSet.add(itemId);
		}
		selectedItems = newSet;
	}

	async function updateQuantity(item: CartItem, newQuantity: number) {
		if (newQuantity < 1) return;
		const success = await cartStore.updateQuantity(item.id, newQuantity);
		if (!success) {
			alert('Gagal mengupdate jumlah');
		}
	}

	async function removeItem(item: CartItem) {
		const success = await cartStore.removeItem(item.id);
		if (!success) {
			alert('Gagal menghapus item');
		} else {
			selectedItems.delete(item.id);
		}
	}

	async function clearCart() {
		if (!confirm('Hapus semua item dari keranjang?')) return;
		const success = await cartStore.clear();
		if (success) {
			selectedItems = new Set();
		}
	}

	async function handleApplyCoupon() {
		if (!couponCode.trim()) {
			alert('Masukkan kode kupon');
			return;
		}

		applyingCoupon = true;

		let userId = localStorage.getItem('cart_user_id');
		if (!userId) {
			userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			localStorage.setItem('cart_user_id', userId);
		}

		const success = await appliedCoupon.apply(
			couponCode.trim().toUpperCase(),
			subtotalAmount,
			userId
		);

		if (success) {
			couponCode = '';
		}

		applyingCoupon = false;
	}

	function handleRemoveCoupon() {
		appliedCoupon.remove();
	}

	function handleCheckout() {
		if (selectedItems.size === 0) {
			alert('Pilih produk yang ingin dibeli');
			return;
		}
		showMethodSelector = true;
	}

	async function processCheckout(method: string) {
		if (!user) return;

		selectedMethod = method;
		checkoutLoading = true;
		showMethodSelector = false;

		try {
			const selectedCartItems = cart.filter((item) => selectedItems.has(item.id));

			const today = new Date();
			const ymd = today.toISOString().slice(2, 10).replace(/-/g, '');
			const run = String(Math.floor(Math.random() * 1e4)).padStart(4, '0');
			const orderId = `CART${ymd}-${run}`;

			const totalAmount = selectedCartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);

			const res = await fetch('/api/checkout-cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cart_items: selectedCartItems.map((item) => ({
						product_id: item.product_id,
						quantity: item.quantity
					})),
					order_id: orderId,
					payment_method: method,
					total_amount: totalAmount,
					user_id: user.id // Tambah ini
				})
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				alert(data.error || 'Gagal membuat transaksi');
				checkoutLoading = false;
				return;
			}

			paymentData = data;

			if (method === 'qris') {
				qrImageUrl = await QRCode.toDataURL(data.payment_number, {
					width: 300,
					margin: 2
				});
			}

			showPayment = true;
			startPolling(orderId);
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Terjadi kesalahan saat checkout');
		} finally {
			checkoutLoading = false;
		}
	}

	function handleSelectQRIS() {
		processCheckout('qris');
	}

	function handleSelectOther(method: string) {
		processCheckout(method);
	}

	function startPolling(orderId: string) {
		pollingInterval = setInterval(async () => {
			try {
				const res = await fetch('/api/check-payment', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ order_id: orderId })
				});

				const data = await res.json();

				if (data.status === 'completed') {
					clearInterval(pollingInterval);

					for (const itemId of selectedItems) {
						await cartStore.removeItem(itemId);
					}
					selectedItems = new Set();

					window.location.href = `/success?order_id=${orderId}`;
				}
			} catch (error) {
				console.error('Polling error:', error);
			}
		}, 3000);

		setTimeout(() => {
			if (pollingInterval) clearInterval(pollingInterval);
		}, 600000);
	}

	function closePayment() {
		if (pollingInterval) clearInterval(pollingInterval);
		showPayment = false;
		paymentData = null;
		qrImageUrl = '';
	}

	function closeMethodSelector() {
		showMethodSelector = false;
	}

	async function simulatePayment() {
		if (!paymentData || isSimulating) return;

		isSimulating = true;

		try {
			const res = await fetch('/api/simulate-payment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					order_id: paymentData.order_id,
					amount: paymentData.amount // Gunakan amount, bukan total_payment
				})
			});

			if (res.ok) {
				alert('Simulasi berhasil! Tunggu sebentar...');
			} else {
				const data = await res.json();
				alert(data.error || 'Simulasi gagal');
				isSimulating = false;
			}
		} catch (error) {
			console.error('Simulate error:', error);
			alert('Terjadi kesalahan saat simulasi');
			isSimulating = false;
		}
	}

	function getItemSubtotal(item: CartItem): number {
		if (!item.product) return 0;
		const price = calculateDiscountedPrice(item.product);
		return price * item.quantity;
	}

	const subtotalAmount = $derived(
		cart
			.filter((item) => selectedItems.has(item.id))
			.reduce((sum, item) => sum + getItemSubtotal(item), 0)
	);

	const discountAmount = $derived($appliedCoupon ? $appliedCoupon.discount_amount : 0);
	const totalAmount = $derived(subtotalAmount - discountAmount);
	const dummyProduct = $derived({
		id: 'CART_CHECKOUT',
		name:
			selectedItems.size > 1
				? 'Multi Product'
				: cart.find((item) => selectedItems.has(item.id))?.product?.name || 'Product',
		price: totalAmount, // Gunakan totalAmount, bukan subtotalAmount
		description: `${selectedItems.size} produk dipilih`,
		stock: 999
	});
</script>

<div class="min-h-screen bg-base-200">
	<Navbar />

	<div class="container mx-auto px-4 py-8">
		<h1 class="mb-6 text-3xl font-bold">Keranjang</h1>

		{#if loading}
			<div class="flex justify-center py-20">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if cart.length === 0}
			<div class="mx-auto max-w-2xl">
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body items-center py-16 text-center">
						<div class="mb-6">
							<svg class="mx-auto h-32 w-32 text-warning" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M7 4V2h10v2h5v2h-2v13c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6H2V4h5zm2 0h6v12H9V4zm11 2H4v13h14V6zM9 8h2v8H9V8zm4 0h2v8h-2V8z"
								/>
							</svg>
						</div>
						<h2 class="mb-2 text-2xl font-bold">Wah, keranjang belanjamu kosong</h2>
						<p class="mb-8 text-base-content/70">Yuk, isi dengan barang-barang impianmu!</p>
						<a href="/shop" class="btn btn-lg btn-primary">
							<span>🛍️</span>
							Mulai Belanja
						</a>
					</div>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div class="space-y-4 lg:col-span-2">
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex items-center justify-between">
								<label class="flex cursor-pointer items-center gap-3">
									<input
										type="checkbox"
										class="checkbox checkbox-primary"
										checked={allSelected}
										onchange={toggleSelectAll}
									/>
									<span class="font-semibold">Pilih Semua ({cart.length})</span>
								</label>
								{#if cart.length > 0}
									<button class="btn text-error btn-ghost btn-sm" onclick={clearCart}>
										Hapus
									</button>
								{/if}
							</div>
						</div>
					</div>

					{#each cart as item}
						{#if item.product}
							<div class="card bg-base-100 shadow-xl">
								<div class="card-body">
									<div class="flex gap-4">
										<div class="flex items-start">
											<input
												type="checkbox"
												class="checkbox checkbox-primary"
												checked={selectedItems.has(item.id)}
												onchange={() => toggleSelectItem(item.id)}
											/>
										</div>

										<figure class="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
											<img
												src={item.product.images?.[0] || 'https://via.placeholder.com/200'}
												alt={item.product.name}
												class="h-full w-full object-cover"
											/>
										</figure>

										<div class="flex-1">
											<h3 class="font-bold">{item.product.name}</h3>

											<div class="mt-2">
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

											<div class="mt-3 flex items-center justify-between">
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

												<button
													type="button"
													class="btn text-error btn-ghost btn-sm"
													onclick={() => removeItem(item)}
													aria-label={'Hapus ' + (item.product?.name ?? 'item')}
													title={'Hapus ' + (item.product?.name ?? 'item')}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											</div>

											{#if item.product.stock < item.quantity}
												<div class="mt-2 text-xs text-error">
													Stok tidak cukup! Tersisa {item.product.stock}
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<div class="lg:col-span-1">
					<div class="card sticky top-4 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title">Ringkasan belanja</h2>

							<div class="divider"></div>

							{#if selectedItems.size === 0}
								<div class="rounded-lg border-2 border-dashed border-base-300 p-4 text-center">
									<svg
										class="mx-auto mb-2 h-12 w-12 text-base-content/30"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
										/>
									</svg>
									<p class="text-sm text-base-content/70">Pilih barang dulu sebelum pakai promo</p>
								</div>
							{:else}
								<div class="form-control">
									<div class="join">
										<input
											type="text"
											placeholder="KODE PROMO"
											class="input-bordered input join-item w-full uppercase"
											bind:value={couponCode}
											disabled={$appliedCoupon !== null}
										/>
										{#if $appliedCoupon}
											<button class="btn join-item btn-error" onclick={handleRemoveCoupon}>
												Hapus
											</button>
										{:else}
											<button
												class="btn join-item btn-primary"
												onclick={handleApplyCoupon}
												disabled={applyingCoupon || !couponCode.trim()}
											>
												{#if applyingCoupon}
													<span class="loading loading-sm loading-spinner"></span>
												{:else}
													Pakai
												{/if}
											</button>
										{/if}
									</div>
								</div>

								{#if $appliedCoupon}
									<div class="mt-2 rounded-lg bg-success/10 p-3 text-sm text-success">
										<div class="font-semibold">{$appliedCoupon.coupon.name}</div>
										<div>Hemat {formatCurrency($appliedCoupon.discount_amount)}</div>
									</div>
								{/if}
							{/if}

							<div class="divider"></div>

							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span>Total ({selectedItems.size} item)</span>
									<span>{selectedItems.size === 0 ? '-' : formatCurrency(subtotalAmount)}</span>
								</div>

								{#if $appliedCoupon}
									<div class="flex justify-between text-sm text-success">
										<span>Diskon</span>
										<span>- {formatCurrency(discountAmount)}</span>
									</div>
								{/if}
							</div>

							<div class="divider"></div>

							<div class="flex justify-between text-lg font-bold">
								<span>Total</span>
								<span class="text-primary">
									{selectedItems.size === 0 ? '-' : formatCurrency(totalAmount)}
								</span>
							</div>

							<button
								class="btn mt-4 btn-block btn-primary"
								onclick={handleCheckout}
								disabled={checkoutLoading || selectedItems.size === 0}
							>
								{#if checkoutLoading}
									<span class="loading loading-sm loading-spinner"></span>
									Processing...
								{:else}
									Beli ({selectedItems.size})
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showMethodSelector && dummyProduct}
	<MethodSelectorModal
		product={dummyProduct}
		paymentMethods={[...PAYMENT_METHODS]}
		isCartCheckout={true}
		itemCount={selectedItems.size}
		onClose={closeMethodSelector}
		onSelectQRIS={handleSelectQRIS}
		onSelectOther={handleSelectOther}
	/>
{/if}
{#if showPayment && paymentData && dummyProduct}
	<PaymentModal
		product={dummyProduct}
		{paymentData}
		{qrImageUrl}
		{isSimulating}
		isCartCheckout={true}
		onClose={closePayment}
		onSimulate={simulatePayment}
	/>
{/if}
