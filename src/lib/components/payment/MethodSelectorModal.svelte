<script lang="ts">
	import type { Product } from '$lib/types/types';
	import { formatCurrency } from '$lib/utils/format.utils';

	type PaymentMethod = {
		value: string;
		label: string;
		icon: string;
	};

	type Props = {
		product: Product;
		paymentMethods: PaymentMethod[];
		isCartCheckout?: boolean;
		itemCount?: number;
		totalAmount?: number; // TAMBAH INI
		onClose: () => void;
		onSelectQRIS: () => void;
		onSelectOther: (method: string) => void;
	};

	let {
		product,
		paymentMethods,
		isCartCheckout = false,
		itemCount = 1,
		totalAmount, // TAMBAH INI
		onClose,
		onSelectQRIS,
		onSelectOther
	}: Props = $props();

	let selectedMethod = $state('');

	const otherMethods = $derived(paymentMethods.filter((m) => m.value !== 'qris'));

	// Gunakan totalAmount kalau ada, kalau tidak pakai product.price
	const displayAmount = $derived(totalAmount || product.price);

	function handleContinue() {
		if (!selectedMethod || selectedMethod === '') {
			alert('Pilih metode pembayaran terlebih dahulu');
			return;
		}
		onSelectOther(selectedMethod);
	}
</script>

<div class="modal-open modal">
	<div class="modal-box max-w-md">
		<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm" onclick={onClose}>
			✕
		</button>

		<h3 class="mb-4 text-lg font-bold">Pilih Metode Pembayaran</h3>

		<!-- Product Summary -->
		<div class="mb-6 rounded-lg bg-base-200 p-4">
			<div class="text-sm text-base-content/70">
				{isCartCheckout ? `Total Belanja (${itemCount} item)` : 'Produk'}:
			</div>
			{#if !isCartCheckout}
				<div class="font-semibold">{product.name}</div>
			{/if}
			<div class="mt-2 text-xl font-bold text-primary">
				{formatCurrency(displayAmount)}
			</div>
		</div>

		<button class="btn mb-4 btn-block btn-lg btn-primary" onclick={onSelectQRIS}>
			<span class="text-2xl">📱</span>
			<div class="text-left">
				<div class="font-bold">QRIS</div>
				<div class="text-xs opacity-70">Semua E-Wallet & Bank</div>
			</div>
		</button>

		<div class="divider text-sm">Atau pilih metode lain</div>

		<select class="select-bordered select mb-4 w-full" bind:value={selectedMethod}>
			<option value="" disabled selected>Pilih Virtual Account atau Retail</option>
			{#each otherMethods as method}
				<option value={method.value}>
					{method.icon}
					{method.label}
				</option>
			{/each}
		</select>

		<button
			class="btn btn-block btn-outline"
			onclick={handleContinue}
			disabled={!selectedMethod || selectedMethod === ''}
		>
			Lanjutkan ke Pembayaran
		</button>
	</div>
</div>
