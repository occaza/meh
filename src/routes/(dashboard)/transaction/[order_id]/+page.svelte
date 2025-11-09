<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	type TransactionDetail = {
		order_id: string;
		amount: number;
		status: string;
		payment_method?: string;
		completed_at?: string;
		created_at?: string;
		products: { name: string; description: string; price: number } | null;
	};

	let transaction = $state<TransactionDetail | null>(null);
	let loading = $state(true);
	let error = $state('');

	const orderId = $derived($page.params.order_id);

	onMount(async () => {
		try {
			const res = await fetch(`/api/admin/transactions/${orderId}`);
			if (res.ok) {
				transaction = await res.json();
			} else {
				error = 'Transaksi tidak ditemukan';
			}
		} catch (err) {
			error = 'Gagal memuat transaksi';
		} finally {
			loading = false;
		}
	});

	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'pending':
				return 'badge-warning';
			case 'failed':
				return 'badge-error';
			default:
				return 'badge-ghost';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'completed':
				return 'Selesai';
			case 'pending':
				return 'Menunggu';
			case 'failed':
				return 'Gagal';
			case 'expired':
				return 'Kadaluarsa';
			default:
				return status;
		}
	}

	function formatDate(dateString: string | undefined) {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mx-auto max-w-3xl">
	<div class="mb-8">
		<a href="/transaction" class="btn btn-ghost btn-sm">
			<span>←</span>
			Kembali
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{:else if transaction}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-2xl">Detail Transaksi</h2>

				<div class="divider"></div>

				<div class="space-y-4">
					<div class="flex justify-between">
						<span class="text-base-content/70">Order ID:</span>
						<span class="font-mono font-semibold">{transaction.order_id}</span>
					</div>

					<div class="flex justify-between">
						<span class="text-base-content/70">Status:</span>
						<span class="badge {getStatusBadge(transaction.status)}">
							{getStatusText(transaction.status)}
						</span>
					</div>

					<div class="divider"></div>

					<div>
						<div class="mb-2 text-sm text-base-content/70">Produk:</div>
						{#if transaction.products}
							<div class="rounded-lg bg-base-200 p-4">
								<div class="font-semibold">{transaction.products.name}</div>
								<div class="text-sm text-base-content/70">{transaction.products.description}</div>
								<div class="mt-2 text-lg font-bold text-primary">
									Rp{transaction.products.price.toLocaleString('id-ID')}
								</div>
							</div>
						{:else}
							<span>-</span>
						{/if}
					</div>

					<div class="divider"></div>

					<div class="flex justify-between">
						<span class="text-base-content/70">Total Pembayaran:</span>
						<span class="text-2xl font-bold text-primary">
							Rp{transaction.amount.toLocaleString('id-ID')}
						</span>
					</div>

					<div class="flex justify-between">
						<span class="text-base-content/70">Metode Pembayaran:</span>
						<span class="font-semibold">{transaction.payment_method || '-'}</span>
					</div>

					<div class="divider"></div>

					<div class="flex justify-between">
						<span class="text-base-content/70">Tanggal Dibuat:</span>
						<span>{formatDate(transaction.created_at)}</span>
					</div>

					{#if transaction.completed_at}
						<div class="flex justify-between">
							<span class="text-base-content/70">Tanggal Selesai:</span>
							<span>{formatDate(transaction.completed_at)}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
