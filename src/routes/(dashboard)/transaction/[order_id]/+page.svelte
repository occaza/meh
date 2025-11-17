<!-- src/routes/(dashboard)/transaction/[order_id]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getStatusBadge, getStatusText, formatCurrency, formatDate } from '$lib';
	import { formatPaymentMethod } from '$lib/utils/payment.utils';

	type ProductInfo = {
		name: string;
		description: string;
		price: number;
		images?: string[];
	};

	type TransactionItem = {
		product: ProductInfo;
		amount: number;
		note?: string;
	};

	type TransactionDetail = {
		order_id: string;
		total_amount: number;
		status: string;
		payment_method?: string;
		completed_at?: string;
		created_at?: string;
		items: TransactionItem[];
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
</script>

<div class="mx-auto max-w-4xl">
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
						<div class="mb-3 text-sm text-base-content/70">
							Produk ({transaction.items.length} item):
						</div>
						<div class="space-y-3">
							{#each transaction.items as item}
								{#if item.product}
									<div class="flex gap-4 rounded-lg bg-base-200 p-4">
										<div class="h-20 w-20 overflow-hidden rounded-lg border border-base-300">
											<img
												src={item.product.images?.[0] ||
													'https://placehold.co/100x100?text=No+Image'}
												alt={item.product.name}
												class="h-full w-full object-cover"
											/>
										</div>
										<div class="flex-1">
											<div class="font-semibold">{item.product.name}</div>
											<div class="text-sm text-base-content/70">{item.product.description}</div>
											<div class="mt-2 font-bold text-primary">
												{formatCurrency(item.amount)}
											</div>
										</div>
										{#if item.note}
											<div class="mt-3 rounded bg-base-300 p-2">
												<div class="text-xs font-semibold text-base-content/70">
													Catatan dari Pembeli:
												</div>
												<div class="text-sm">{item.note}</div>
											</div>
										{/if}
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<div class="divider"></div>

					<div class="flex justify-between">
						<span class="text-base-content/70">Total Pembayaran:</span>
						<span class="text-2xl font-bold text-primary">
							{formatCurrency(transaction.total_amount)}
						</span>
					</div>

					<div class="flex justify-between">
						<span class="text-base-content/70">Metode Pembayaran:</span>
						<span class="font-semibold">{formatPaymentMethod(transaction.payment_method)}</span>
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
