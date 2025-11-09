<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product } from '$lib/types/types';
	import QRCode from 'qrcode';

	let products = $state<Product[]>([]);
	let loading = $state(true);
	let showPayment = $state(false);
	let showMethodSelector = $state(false);
	let selectedProduct = $state<Product | null>(null);
	let selectedMethod = $state('qris');
	let paymentData = $state<any>(null);
	let qrImageUrl = $state('');
	let pollingInterval = $state<any>(null);
	let isSimulating = $state(false);

	const paymentMethods = [
		{ value: 'qris', label: 'QRIS (Semua E-Wallet & Bank)', icon: '📱' },
		{ value: 'bni_va', label: 'Virtual Account BNI', icon: '🏦' },
		{ value: 'bri_va', label: 'Virtual Account BRI', icon: '🏦' },
		{ value: 'cimb_niaga_va', label: 'Virtual Account CIMB Niaga', icon: '🏦' },
		{ value: 'permata_va', label: 'Virtual Account Permata', icon: '🏦' },
		{ value: 'sampoerna_va', label: 'Virtual Account Sampoerna', icon: '🏦' },
		{ value: 'maybank_va', label: 'Virtual Account Maybank', icon: '🏦' },
		{ value: 'bnc_va', label: 'Virtual Account BNC', icon: '🏦' },
		{ value: 'atm_bersama_va', label: 'Virtual Account ATM Bersama', icon: '🏦' },
		{ value: 'artha_graha_va', label: 'Virtual Account Artha Graha', icon: '🏦' },
		{ value: 'retail', label: 'Retail (Indomaret/Alfamart)', icon: '🏪' }
	];

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

	function showMethodSelection(product: Product) {
		selectedProduct = product;
		selectedMethod = '';
		showMethodSelector = true;
	}

	async function checkout() {
		if (!selectedProduct) return;

		const orderId = `ORDER_${Date.now()}`;
		showMethodSelector = false;

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: selectedProduct.id,
					order_id: orderId,
					payment_method: selectedMethod
				})
			});

			const data = await res.json();

			console.log('Checkout response:', data);

			if (!res.ok || data.error) {
				alert(data.error || 'Gagal membuat transaksi.');
				return;
			}

			if (!data.payment_number) {
				console.error('Missing payment_number in response:', data);
				alert('Response tidak valid dari server.');
				return;
			}

			paymentData = data;

			if (selectedMethod === 'qris') {
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

	function closeMethodSelector() {
		showMethodSelector = false;
		selectedProduct = null;
		selectedMethod = '';
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

			const data = await res.json();

			if (res.ok) {
				alert('Simulasi berhasil! Tunggu sebentar...');
			} else {
				alert(data.error || 'Simulasi gagal');
				isSimulating = false;
			}
		} catch (error) {
			console.error('Simulate error:', error);
			alert('Terjadi kesalahan saat simulasi');
			isSimulating = false;
		}
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
							<button
								class="btn btn-block btn-primary"
								onclick={() => showMethodSelection(product)}
							>
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

<!-- Modal Pilih Metode Pembayaran -->
{#if showMethodSelector && selectedProduct}
	<div class="modal-open modal">
		<div class="modal-box max-w-md">
			<button
				class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"
				onclick={closeMethodSelector}
			>
				✕
			</button>

			<h3 class="mb-4 text-lg font-bold">Pilih Metode Pembayaran</h3>

			<div class="mb-6 rounded-lg bg-base-200 p-4">
				<div class="text-sm text-base-content/70">Produk:</div>
				<div class="font-semibold">{selectedProduct.name}</div>
				<div class="mt-2 text-xl font-bold text-primary">
					Rp{selectedProduct.price.toLocaleString('id-ID')}
				</div>
			</div>

			<!-- QRIS Button Besar -->
			<button
				class="btn mb-4 btn-block btn-lg btn-primary"
				onclick={() => {
					selectedMethod = 'qris';
					checkout();
				}}
			>
				<span class="text-2xl">📱</span>
				<div class="text-left">
					<div class="font-bold">QRIS</div>
					<div class="text-xs opacity-70">Semua E-Wallet & Bank</div>
				</div>
			</button>

			<div class="divider text-sm">Atau pilih metode lain</div>

			<!-- Dropdown untuk metode lain -->
			<select class="select-bordered select mb-4 w-full" bind:value={selectedMethod}>
				<option value="" disabled selected>Pilih Virtual Account atau Retail</option>
				<option value="bni_va">🏦 Virtual Account BNI</option>
				<option value="bri_va">🏦 Virtual Account BRI</option>
				<option value="cimb_niaga_va">🏦 Virtual Account CIMB Niaga</option>
				<option value="permata_va">🏦 Virtual Account Permata</option>
				<option value="sampoerna_va">🏦 Virtual Account Sampoerna</option>
				<option value="maybank_va">🏦 Virtual Account Maybank</option>
				<option value="bnc_va">🏦 Virtual Account BNC</option>
				<option value="atm_bersama_va">🏦 Virtual Account ATM Bersama</option>
				<option value="artha_graha_va">🏦 Virtual Account Artha Graha</option>
				<option value="retail">🏪 Retail (Indomaret/Alfamart)</option>
			</select>

			<button
				class="btn btn-block btn-outline"
				onclick={checkout}
				disabled={!selectedMethod || selectedMethod === ''}
			>
				Lanjutkan ke Pembayaran
			</button>
		</div>
	</div>
{/if}

<!-- Modal Pembayaran -->
{#if showPayment && paymentData}
	<div class="modal-open modal">
		<div class="modal-box max-w-md">
			<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm" onclick={closePayment}>
				✕
			</button>

			<h3 class="mb-4 text-lg font-bold">
				{#if paymentData.payment_method === 'qris'}
					Scan QR Code untuk Bayar
				{:else}
					Detail Pembayaran
				{/if}
			</h3>

			<div class="mb-4 rounded-lg bg-base-200 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm">Total Pembayaran:</span>
					<span class="text-xl font-bold text-primary">
						Rp{paymentData.total_payment.toLocaleString('id-ID')}
					</span>
				</div>

				<div class="mb-1 flex justify-between text-sm text-base-content/70">
					<span>Harga Produk:</span>
					<span>Rp{selectedProduct?.price.toLocaleString('id-ID')}</span>
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

			{#if paymentData.payment_method === 'qris'}
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
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span class="text-sm">
						Buka aplikasi mobile banking atau e-wallet Anda, lalu scan QR code di atas.
					</span>
				</div>
			{:else}
				<div class="mb-4 rounded-lg bg-base-200 p-4">
					<div class="mb-2 text-sm font-semibold">Nomor Virtual Account / Kode Pembayaran:</div>
					<div class="flex items-center gap-2">
						<input
							type="text"
							value={paymentData.payment_number}
							readonly
							class="input-bordered input w-full font-mono"
						/>
						<button
							class="btn btn-square btn-primary"
							onclick={() => {
								navigator.clipboard.writeText(paymentData.payment_number);
								alert('Nomor berhasil disalin!');
							}}
						>
							📋
						</button>
					</div>
				</div>

				<div class="mb-4 alert alert-info">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span class="text-sm">
						Gunakan nomor di atas untuk melakukan pembayaran melalui ATM, mobile banking, atau
						retail.
					</span>
				</div>
			{/if}

			<div class="mt-4">
				<button
					class="btn btn-block btn-sm btn-warning"
					onclick={() => simulatePayment()}
					disabled={isSimulating}
				>
					{#if isSimulating}
						<span class="loading loading-sm loading-spinner"></span>
						Memproses simulasi...
					{:else}
						🧪 Simulasi Pembayaran (Development Only)
					{/if}
				</button>
			</div>

			<div class="mt-4 flex items-center justify-center gap-2 text-warning">
				<span class="loading loading-sm loading-spinner"></span>
				<span class="font-medium">Menunggu pembayaran...</span>
			</div>
		</div>
	</div>
{/if}
