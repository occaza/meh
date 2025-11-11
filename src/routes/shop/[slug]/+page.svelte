<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Product } from '$lib/types/types';
	import Navbar from '$lib/components/shared/Navbar.svelte';
	import { formatCurrency, formatStock } from '$lib/utils/format.utils';
	import { calculateDiscountedPrice, isDiscountActive, isInStock } from '$lib/utils/product.utils';
	import { cartStore } from '$lib/stores/cart.store';
	import PaymentModal from '$lib/components/payment/PaymentModal.svelte';
	import MethodSelectorModal from '$lib/components/payment/MethodSelectorModal.svelte';
	import { PAYMENT_METHODS } from '$lib/constants/payment.constants';
	import QRCode from 'qrcode';

	let product = $state<Product | null>(null);
	let loading = $state(true);
	let selectedImage = $state(0);
	let quantity = $state(1);
	let addingToCart = $state(false);

	// Payment states (copas dari shop)
	let showPayment = $state(false);
	let showMethodSelector = $state(false);
	let selectedMethod = $state('qris');
	let paymentData = $state<any>(null);
	let qrImageUrl = $state('');
	let pollingInterval = $state<any>(null);
	let isSimulating = $state(false);

	const productId = $derived($page.params.id);
	const hasDiscount = $derived(product ? isDiscountActive(product) : false);
	const finalPrice = $derived(product ? calculateDiscountedPrice(product) : 0);
	const inStock = $derived(product ? isInStock(product, quantity) : false);

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
		showMethodSelector = true;
	}

	// Payment functions (copas dari shop)
	async function processCheckout(method: string) {
		if (!product) return;

		selectedMethod = method;
		const today = new Date();
		const ymd = today.toISOString().slice(2, 10).replace(/-/g, '');
		const run = String(Math.floor(Math.random() * 1e4)).padStart(4, '0');
		const orderId = `ADF${ymd}-${run}`;
		showMethodSelector = false;

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: product.id,
					order_id: orderId,
					payment_method: method
				})
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				alert(data.error || 'Gagal membuat transaksi.');
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
</script>

<div class="min-h-screen bg-base-200">
	<Navbar />

	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if product}
		<div class="container mx-auto px-4 py-8">
			<!-- Breadcrumb -->
			<div class="breadcrumbs mb-4 text-sm">
				<ul>
					<li><a href="/">Beranda</a></li>
					<li><a href="/shop">Belanja</a></li>
					<li>{product.name}</li>
				</ul>
			</div>

			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<!-- Image Gallery -->
				<div>
					<div class="mb-4 overflow-hidden rounded-lg bg-base-100">
						<img
							src={product.images?.[selectedImage] || 'https://placehold.co/600x600?text=No+Image'}
							alt={product.name}
							class="h-96 w-full object-contain"
						/>
					</div>

					<!-- Thumbnail -->
					{#if product.images && product.images.length > 1}
						<div class="flex gap-2">
							{#each product.images as image, index}
								<button
									onclick={() => (selectedImage = index)}
									class="overflow-hidden rounded-lg border-2 transition"
									class:border-primary={selectedImage === index}
									class:border-base-300={selectedImage !== index}
								>
									<img
										src={image}
										alt={`${product.name} ${index + 1}`}
										class="h-20 w-20 object-cover"
									/>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Product Info -->
				<div class="space-y-6">
					<div>
						<h1 class="mb-2 text-3xl font-bold">{product.name}</h1>
						<p class="text-base-content/70">{product.description}</p>
					</div>

					<!-- Price -->
					<div class="rounded-lg bg-base-100 p-6">
						{#if hasDiscount && product.discount_percentage}
							<div class="mb-2 flex items-center gap-2">
								<span class="badge badge-error">-{product.discount_percentage}%</span>
								<span class="text-sm text-base-content/50 line-through">
									{formatCurrency(product.price)}
								</span>
							</div>
							<div class="text-3xl font-bold text-primary">
								{formatCurrency(finalPrice)}
							</div>
						{:else}
							<div class="text-3xl font-bold text-primary">
								{formatCurrency(product.price)}
							</div>
						{/if}

						<div class="mt-2 text-sm text-base-content/70">
							{formatStock(product.stock)}
						</div>
					</div>

					<!-- Quantity Selector -->
					{#if inStock}
						<div class="rounded-lg bg-base-100 p-6">
							<div class="mb-2 font-semibold">Jumlah</div>
							<div class="flex items-center gap-4">
								<button
									class="btn btn-circle btn-sm"
									onclick={() => (quantity = Math.max(1, quantity - 1))}
									disabled={quantity <= 1}
								>
									−
								</button>
								<input
									type="number"
									class="input-bordered input w-20 text-center"
									bind:value={quantity}
									min="1"
									max={product.stock}
								/>
								<button
									class="btn btn-circle btn-sm"
									onclick={() => (quantity = Math.min(product!.stock, quantity + 1))}
									disabled={quantity >= product!.stock}
								>
									+
								</button>
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex gap-4">
						{#if inStock}
							<button
								class="btn flex-1 btn-outline btn-primary"
								onclick={handleAddToCart}
								disabled={addingToCart}
							>
								{#if addingToCart}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									<span>🛒</span>
									Tambah ke Keranjang
								{/if}
							</button>

							<button class="btn flex-1 btn-primary" onclick={handleBuyNow}>
								<span>⚡</span>
								Beli Sekarang
							</button>
						{:else}
							<button class="btn btn-disabled btn-block" disabled> Stok Habis </button>
						{/if}
					</div>

					<!-- Detail Description -->
					{#if product.detail_description}
						<div class="rounded-lg bg-base-100 p-6">
							<h3 class="mb-4 text-xl font-bold">Detail Produk</h3>
							<p class="whitespace-pre-line text-base-content/80">{product.detail_description}</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modals -->
{#if showMethodSelector && product}
	<MethodSelectorModal
		{product}
		paymentMethods={[...PAYMENT_METHODS]}
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
