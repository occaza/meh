<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product } from '$lib/types/types';
	import QRCode from 'qrcode';

	let products: Product[] = [];
	let loading = true;
	let showPayment = false;
	let paymentData: any = null;
	let qrImageUrl = '';
	let pollingInterval: any;

	onMount(() => {
		(async () => {
			try {
				const res = await fetch('/api/products');
				const data = await res.json();
				products = data;
			} catch (error) {
				console.error('Failed to fetch products:', error);
			} finally {
				loading = false;
			}
		})();

		return () => {
			if (pollingInterval) clearInterval(pollingInterval);
		};
	});

	async function checkout(productId: string) {
		const orderId = `ORDER_${Date.now()}`;

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: productId,
					order_id: orderId
				})
			});

			const data = await res.json();

			if (data.redirectUrl) {
				window.location.href = data.redirectUrl;
			} else {
				alert('Gagal membuat transaksi.');
			}
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Terjadi kesalahan.');
		}
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
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		}, 600000);
	}

	function closePayment() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
		showPayment = false;
		paymentData = null;
		qrImageUrl = '';
	}

	function formatExpiry(expiredAt: string) {
		const date = new Date(expiredAt);
		return date.toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-8 text-center text-4xl font-bold">Produk Kami</h1>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if products.length}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each products as product}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">{product.name}</h2>
						<p class="text-base-content/70">{product.description}</p>
						<div class="my-2 text-2xl font-bold text-primary">
							Rp{product.price.toLocaleString('id-ID')}
						</div>
						<div class="card-actions justify-end">
							<button class="btn btn-block btn-primary" on:click={() => checkout(product.id)}>
								Beli Sekarang
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Tidak ada produk tersedia.</span>
		</div>
	{/if}
</div>

{#if showPayment && paymentData}
	<div class="modal-open modal">
		<div class="modal-box max-w-md">
			<button
				class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"
				on:click={closePayment}
			>
				✕
			</button>

			<h3 class="mb-4 text-lg font-bold">Scan QR Code untuk Bayar</h3>

			<div class="mb-4 rounded-lg bg-base-200 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm">Total Pembayaran:</span>
					<span class="text-xl font-bold text-primary">
						Rp{paymentData.total_payment.toLocaleString('id-ID')}
					</span>
				</div>
				<div class="mb-1 flex justify-between text-sm text-base-content/70">
					<span>Biaya Admin:</span>
					<span>Rp{paymentData.fee.toLocaleString('id-ID')}</span>
				</div>
				<div class="flex justify-between text-sm text-base-content/70">
					<span>Berlaku hingga:</span>
					<span>{formatExpiry(paymentData.expired_at)}</span>
				</div>
			</div>

			<div class="mb-4 flex justify-center">
				<div class="rounded-lg border-4 border-base-300 p-4">
					{#if qrImageUrl}
						<img src={qrImageUrl} alt="QR Code QRIS" class="h-72 w-72" />
					{:else}
						<div class="flex h-72 w-72 items-center justify-center">
							<span class="loading loading-lg loading-spinner"></span>
						</div>
					{/if}
				</div>
			</div>

			<div class="mb-4 alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 shrink-0 stroke-current"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path></svg
				>
				<span class="text-sm"
					>Buka aplikasi mobile banking atau e-wallet Anda, lalu scan QR code di atas.</span
				>
			</div>

			<div class="flex items-center justify-center gap-2 text-warning">
				<span class="loading loading-sm loading-spinner"></span>
				<span class="font-medium">Menunggu pembayaran...</span>
			</div>
		</div>
	</div>
{/if}
