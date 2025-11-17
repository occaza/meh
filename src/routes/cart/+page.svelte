<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Navbar,
		cartStore,
		cartCount,
		generateOrderId,
		encodeOrderId,
		formatCurrency,
		calculateDiscountedPrice,
		PAYMENT_METHODS,
		MethodSelectorModal,
		PaymentModal
	} from '$lib';
	import { appliedCoupon } from '$lib/stores/coupon.store';
	import type { CartItem } from '$lib/types/types';
	import QRCode from 'qrcode';
	import { authUser } from '$lib/stores/auth.store';

	const user = $derived($authUser);

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
	let editingNote = $state<string | null>(null);
	let tempNotes = $state<Record<string, string>>({});

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

	async function updateNote(itemId: string) {
		try {
			const note = tempNotes[itemId] || '';

			const res = await fetch(`/api/cart/${itemId}/note`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note })
			});

			if (res.ok) {
				await cartStore.load();
				editingNote = null;
			} else {
				alert('Gagal menyimpan catatan');
			}
		} catch (error) {
			console.error('Update note error:', error);
			alert('Terjadi kesalahan');
		}
	}

	function startEditNote(item: CartItem) {
		editingNote = item.id;
		tempNotes[item.id] = item.note || '';
	}

	function cancelEditNote() {
		editingNote = null;
		tempNotes = {};
	}

	async function processCheckout(method: string) {
		if (!user) return;

		selectedMethod = method;
		checkoutLoading = true;
		showMethodSelector = false;

		try {
			const selectedCartItems = cart.filter((item) => selectedItems.has(item.id));

			const orderId = generateOrderId();
			const encodedOrderId = encodeOrderId(orderId);

			const totalAmount = selectedCartItems.reduce((sum, item) => sum + getItemSubtotal(item), 0);

			const res = await fetch('/api/checkout-cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cart_items: selectedCartItems.map((item) => ({
						product_id: item.product_id,
						quantity: item.quantity,
						note: item.note || null // TAMBAH INI
					})),
					order_id: encodedOrderId,
					payment_method: method,
					total_amount: totalAmount,
					user_id: user.id
				})
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				alert(data.error || 'Gagal membuat transaksi');
				checkoutLoading = false;
				return;
			}

			for (const itemId of selectedItems) {
				await cartStore.removeItem(itemId);
			}
			selectedItems = new Set();

			goto(`/payment/${encodedOrderId}`); // Route pakai encoded
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Terjadi kesalahan saat checkout');
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
					amount: paymentData.amount
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
		price: totalAmount,
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
				<!-- Cart Items -->
				<div class="space-y-4 lg:col-span-2">
					<!-- Header -->
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body py-4">
							<div class="flex items-center justify-between">
								<label class="flex cursor-pointer items-center gap-3">
									<input
										type="checkbox"
										class="checkbox checkbox-sm checkbox-primary"
										checked={allSelected}
										onchange={toggleSelectAll}
									/>
									<span class="text-sm font-semibold">Pilih Semua</span>
								</label>
								{#if cart.length > 0}
									<button class="btn text-error btn-ghost btn-sm" onclick={clearCart}>
										Hapus
									</button>
								{/if}
							</div>
						</div>
					</div>

					<!-- Cart Items List -->
					{#each cart as item}
						{#if item.product}
							<div class="card bg-base-100 shadow-xl">
								<div class="card-body p-4">
									<div class="flex gap-3">
										<!-- Checkbox -->
										<div class="flex items-start pt-1">
											<input
												type="checkbox"
												class="checkbox checkbox-sm checkbox-primary"
												checked={selectedItems.has(item.id)}
												onchange={() => toggleSelectItem(item.id)}
											/>
										</div>

										<!-- Image -->
										<div
											class="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-base-300"
										>
											<img
												src={item.product.images?.[0] || 'https://via.placeholder.com/200'}
												alt={item.product.name}
												class="h-full w-full object-cover"
											/>
										</div>

										<!-- Product Info -->
										<div class="min-w-0 flex-1">
											<h3 class="truncate text-sm font-semibold">{item.product.name}</h3>

											<div class="mt-1">
												{#if item.product.discount_percentage}
													<div class="flex items-center gap-2">
														<span class="text-sm font-bold text-primary">
															{formatCurrency(calculateDiscountedPrice(item.product))}
														</span>
														<span class="text-xs text-base-content/50 line-through">
															{formatCurrency(item.product.price)}
														</span>
													</div>
												{:else}
													<span class="text-sm font-bold text-primary">
														{formatCurrency(item.product.price)}
													</span>
												{/if}
											</div>

											<!-- Quantity Controls -->
											<div class="mt-3 flex items-center justify-between">
												<div class="flex items-center gap-2">
													<button
														class="btn btn-circle btn-outline btn-xs"
														onclick={() => updateQuantity(item, item.quantity - 1)}
														disabled={item.quantity <= 1}
													>
														−
													</button>
													<span class="w-6 text-center text-sm font-semibold">{item.quantity}</span>
													<button
														class="btn btn-circle btn-outline btn-xs"
														onclick={() => updateQuantity(item, item.quantity + 1)}
														disabled={item.product && item.quantity >= item.product.stock}
													>
														+
													</button>
												</div>

												<button
													type="button"
													class="btn text-error btn-ghost btn-xs"
													onclick={() => removeItem(item)}
												>
													🗑️
												</button>
											</div>

											{#if item.product.stock < item.quantity}
												<div class="mt-2 text-xs text-error">
													Stok tidak cukup! Tersisa {item.product.stock}
												</div>
											{/if}
										</div>
									</div>
									<div class="mt-3">
										{#if editingNote === item.id}
											<div class="space-y-2">
												<textarea
													class="textarea-bordered textarea w-full textarea-sm"
													placeholder="Catatan untuk penjual..."
													bind:value={tempNotes[item.id]}
													rows="2"
												></textarea>
												<div class="flex gap-2">
													<button
														class="btn btn-xs btn-primary"
														onclick={() => updateNote(item.id)}
													>
														Simpan
													</button>
													<button class="btn btn-ghost btn-xs" onclick={cancelEditNote}>
														Batal
													</button>
												</div>
											</div>
										{:else}
											<div class="flex items-start justify-between">
												<div class="flex-1">
													{#if item.note}
														<div class="text-xs text-base-content/70">
															<span class="font-semibold">Catatan:</span>
															{item.note}
														</div>
													{:else}
														<div class="text-xs text-base-content/50">Belum ada catatan</div>
													{/if}
												</div>
												<button class="btn btn-ghost btn-xs" onclick={() => startEditNote(item)}>
													✏️ {item.note ? 'Edit' : 'Tambah'} Catatan
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Summary -->
				<div class="lg:col-span-1">
					<div class="card sticky top-4 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title text-lg">Ringkasan Belanja</h2>

							<div class="divider my-2"></div>

							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-base-content/70">Total ({selectedItems.size} item)</span>
									<span class="font-semibold">
										{selectedItems.size === 0 ? '-' : formatCurrency(subtotalAmount)}
									</span>
								</div>

								{#if $appliedCoupon}
									<div class="flex justify-between text-success">
										<span>Diskon Kupon</span>
										<span class="font-semibold">-{formatCurrency(discountAmount)}</span>
									</div>
								{/if}
							</div>

							<div class="divider my-2"></div>

							<div class="flex justify-between text-base font-bold">
								<span>Total Bayar</span>
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
		{totalAmount}
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
