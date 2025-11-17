<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Product } from '$lib/types/types';
	import { authUser } from '$lib/stores/auth.store';
	import QRCode from 'qrcode';

	import {
		PAYMENT_METHODS,
		MethodSelectorModal,
		PaymentModal,
		Navbar,
		formatCurrency,
		cartStore,
		calculateDiscountedPrice,
		isDiscountActive,
		generateOrderId,
		encodeOrderId,
		isInStock
	} from '$lib';

	let product = $state<Product | null>(null);
	let loading = $state(true);
	let selectedImage = $state(0);
	let quantity = $state(1);
	let addingToCart = $state(false);
	let activeTab = $state<'detail' | 'faq'>('detail');
	let note = $state(''); // TAMBAH INI
	let showPayment = $state(false);
	let showMethodSelector = $state(false);
	let selectedMethod = $state('qris');
	let paymentData = $state<any>(null);
	let qrImageUrl = $state('');
	let pollingInterval = $state<any>(null);
	let isSimulating = $state(false);

	const user = $derived($authUser);
	const productId = $derived($page.params.slug);
	const hasDiscount = $derived(product ? isDiscountActive(product) : false);
	const finalPrice = $derived(product ? calculateDiscountedPrice(product) : 0);
	const inStock = $derived(product ? isInStock(product, quantity) : false);
	const subtotal = $derived(finalPrice * quantity);

	onMount(() => {
		loadProduct();

		return () => {
			if (pollingInterval) clearInterval(pollingInterval);
		};
	});

	async function loadProduct() {
		try {
			const res = await fetch(`/api/products/${productId}`);
			if (res.ok) {
				product = await res.json();
			} else {
				goto('/shop');
			}
		} catch (error) {
			console.error('Failed to load product:', error);
			goto('/shop');
		} finally {
			loading = false;
		}
	}

	async function handleAddToCart() {
		if (!product) return;

		if (!user) {
			alert('Silakan login terlebih dahulu untuk menambahkan ke keranjang');
			goto('/login');
			return;
		}

		addingToCart = true;
		const success = await cartStore.addItem(product, quantity);
		if (success) {
			alert('Produk berhasil ditambahkan ke keranjang!');
		} else {
			alert('Gagal menambahkan ke keranjang');
		}
		addingToCart = false;
	}

	function handleBuyNow() {
		if (!product) return;

		if (!user) {
			alert('Silakan login terlebih dahulu untuk membeli produk');
			goto('/login');
			return;
		}

		showMethodSelector = true;
	}

	async function processCheckout(method: string) {
		if (!product || !user) return;

		selectedMethod = method;
		showMethodSelector = false;

		try {
			const orderId = generateOrderId();
			const encodedOrderId = encodeOrderId(orderId);

			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: product.id,
					order_id: encodedOrderId,
					payment_method: method,
					user_id: user.id,
					quantity: quantity,
					note: note
				})
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				alert(data.error || 'Gagal membuat transaksi.');
				return;
			}

			goto(`/payment/${encodedOrderId}`);
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Terjadi kesalahan. Silakan coba lagi.');
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

	function increaseQuantity() {
		if (product && quantity < product.stock) {
			quantity++;
		}
	}

	function decreaseQuantity() {
		if (quantity > 1) {
			quantity--;
		}
	}

	function handleQuantityInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseInt(target.value);

		if (!isNaN(value) && value >= 1 && product && value <= product.stock) {
			quantity = value;
		}
	}
</script>

<div class="min-h-screen bg-base-200">
	<Navbar />

	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if product}
		<div class="container mx-auto px-4 py-6">
			<div class="breadcrumbs mb-4 text-sm">
				<ul>
					<li><a href="/">Beranda</a></li>
					<li><a href="/shop">Shop</a></li>
					<li>{product.name}</li>
				</ul>
			</div>

			<div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
				<div class="lg:col-span-4">
					<!-- <div class="card bg-base-100 shadow-sm"> -->
					<div class="card-body p-4">
						<div class="mb-3 overflow-hidden rounded-lg border border-base-300">
							<img
								src={product.images?.[selectedImage] ||
									'https://placehold.co/400x400?text=No+Image'}
								alt={product.name}
								class="aspect-square w-full object-contain"
							/>
						</div>

						{#if product.images && product.images.length > 1}
							<div class="flex gap-2">
								{#each product.images as image, index}
									<button
										onclick={() => (selectedImage = index)}
										class="overflow-hidden rounded-lg border-2 transition hover:border-primary"
										class:border-primary={selectedImage === index}
										class:border-base-300={selectedImage !== index}
									>
										<img
											src={image}
											alt={`${product.name} ${index + 1}`}
											class="aspect-square w-16 object-cover"
										/>
									</button>
								{/each}
							</div>
						{/if}
					</div>
					<!-- </div> -->
				</div>

				<div class="lg:col-span-5">
					<!-- <div class="card bg-base-100 shadow-sm"> -->
					<div class="card-body">
						<h1 class="text-2xl leading-tight font-bold">{product.name}</h1>

						<div class="mt-4">
							{#if hasDiscount && product.discount_percentage}
								<div class="flex items-center gap-2">
									<span class="text-3xl font-bold">{formatCurrency(finalPrice)}</span>
									<span class="badge badge-sm badge-error">-{product.discount_percentage}%</span>
								</div>
								<div class="text-sm text-base-content/50 line-through">
									{formatCurrency(product.price)}
								</div>
							{:else}
								<div class="text-3xl font-bold">{formatCurrency(product.price)}</div>
							{/if}
						</div>

						<div class="divider my-4"></div>

						<div class="tabs-boxed tabs w-fit">
							<button
								class="tab"
								class:tab-active={activeTab === 'detail'}
								onclick={() => (activeTab = 'detail')}
							>
								Detail Produk
							</button>
							<button
								class="tab"
								class:tab-active={activeTab === 'faq'}
								onclick={() => (activeTab = 'faq')}
							>
								FAQ
							</button>
						</div>

						<div class="mt-4">
							{#if activeTab === 'detail'}
								<div>
									<p class="text-sm whitespace-pre-line text-base-content/80">
										{product.detail_description || product.description}
									</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#if product.faq && Array.isArray(product.faq) && product.faq.length > 0}
										{#each product.faq as item}
											<div class="collapse-arrow collapse bg-base-200">
												<input type="radio" name="faq-accordion" />
												<div class="collapse-title font-medium">
													{item.question}
												</div>
												<div class="collapse-content">
													<p class="text-sm text-base-content/80">{item.answer}</p>
												</div>
											</div>
										{/each}
									{:else}
										<div class="alert alert-info">
											<span class="text-sm">Belum ada FAQ untuk produk ini.</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
					<!-- </div> -->
				</div>

				<div class="lg:col-span-3">
					<div class="card sticky top-4 bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="font-semibold">Atur jumlah dan catatan</h3>

							<div class="mt-3 flex items-center gap-3">
								<div class="h-12 w-12 overflow-hidden rounded-lg border border-base-300">
									<img
										src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
										alt={product.name}
										class="h-full w-full object-cover"
									/>
								</div>
								<div class="text-sm font-semibold text-base-content/70">
									{hasDiscount ? 'Diskon' : product.name.slice(0, 30) + '...'}
								</div>
							</div>

							<div class="divider my-3"></div>

							<div class="form-control">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<button
											class="btn btn-circle btn-outline btn-sm"
											onclick={decreaseQuantity}
											disabled={quantity <= 1}
										>
											−
										</button>
										<input
											type="number"
											class="input-bordered input input-sm w-16 text-center"
											value={quantity}
											min="1"
											max={product.stock}
											oninput={handleQuantityInput}
										/>
										<button
											class="btn btn-circle btn-outline btn-sm"
											onclick={increaseQuantity}
											disabled={quantity >= product.stock}
										>
											+
										</button>
									</div>
									<div class="text-sm text-base-content/70">
										Stok: <span class="font-semibold">{product.stock.toLocaleString()}</span>
									</div>
								</div>
							</div>

							<div class="divider my-3"></div>
							<div class="form-control">
								<label class="label" for="note">
									<span class="label-text text-sm">Catatan untuk Penjual</span>
								</label>
								<textarea
									id="note"
									class="textarea-bordered textarea h-20 textarea-sm"
									placeholder="Contoh: Tolong kirim warna merah"
									bind:value={note}
								></textarea>
								<div class="label">
									<span class="label-text-alt">Opsional</span>
								</div>
							</div>

							<div class="divider my-3"></div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-base-content/70">Subtotal</span>
								<span class="text-xl font-bold">{formatCurrency(subtotal)}</span>
							</div>

							<div class="mt-4 space-y-2">
								{#if inStock}
									<button
										class="btn btn-block btn-outline btn-primary"
										onclick={handleAddToCart}
										disabled={addingToCart}
									>
										{#if addingToCart}
											<span class="loading loading-sm loading-spinner"></span>
											Menambahkan...
										{:else}
											+ Keranjang
										{/if}
									</button>

									<button class="btn btn-block btn-primary" onclick={handleBuyNow}>
										Beli Langsung
									</button>
								{:else}
									<button class="btn btn-disabled btn-block" disabled>Stok Habis</button>
								{/if}
							</div>

							<div class="mt-4 flex gap-2">
								<button class="btn flex-1 gap-1 btn-ghost btn-sm">
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
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									Chat
								</button>
								<button class="btn flex-1 gap-1 btn-ghost btn-sm">
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
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									</svg>
									Wishlist
								</button>
								<button class="btn flex-1 gap-1 btn-ghost btn-sm">
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
											d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
										/>
									</svg>
									Share
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showMethodSelector && product}
	<MethodSelectorModal
		{product}
		paymentMethods={[...PAYMENT_METHODS]}
		totalAmount={subtotal}
		onClose={closeMethodSelector}
		onSelectQRIS={handleSelectQRIS}
		onSelectOther={handleSelectOther}
	/>
{/if}

{#if showPayment && paymentData && product}
	<PaymentModal
		{product}
		{paymentData}
		{qrImageUrl}
		{isSimulating}
		onClose={closePayment}
		onSimulate={simulatePayment}
	/>
{/if}
