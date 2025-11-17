<!-- src/routes/(dashboard)/transaction/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { formatCurrency, formatShortDate } from '$lib/utils/format.utils';
	import { getStatusBadge } from '$lib/utils/status.utils';
	import { formatPaymentMethod } from '$lib/utils/payment.utils';

	type TransactionWithProduct = {
		order_id: string;
		amount: number;
		status: string;
		payment_method?: string;
		completed_at?: string;
		created_at: string;
		product: {
			name: string;
		};
	};

	let transactions = $state<TransactionWithProduct[]>([]);
	let loading = $state(true);
	let filter = $state('all');

	onMount(async () => {
		await loadTransactions();
	});

	async function loadTransactions() {
		loading = true;
		try {
			const res = await fetch('/api/admin/transactions');
			const data = await res.json();
			transactions = data;
		} catch (error) {
			console.error('Failed to fetch transactions:', error);
		} finally {
			loading = false;
		}
	}

	const filteredTransactions = $derived(
		filter === 'all' ? transactions : transactions.filter((t) => t.status === filter)
	);
</script>

<div>
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Transaksi</h1>
		<button class="btn btn-ghost" onclick={loadTransactions}>
			<span>🔄</span>
			Refresh
		</button>
	</div>

	<div class="mb-6 flex gap-2">
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'all'}
			onclick={() => (filter = 'all')}
		>
			Semua
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'completed'}
			onclick={() => (filter = 'completed')}
		>
			Selesai
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'pending'}
			onclick={() => (filter = 'pending')}
		>
			Pending
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'failed'}
			onclick={() => (filter = 'failed')}
		>
			Gagal
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if filteredTransactions.length}
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Order ID</th>
						<th>Produk</th>
						<th>Amount</th>
						<th>Status</th>
						<th>Metode</th>
						<th>Tanggal</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredTransactions as transaction}
						<tr class="hover">
							<td class="font-mono text-sm">{transaction.order_id}</td>
							<td>{transaction.product.name}</td>
							<td class="font-semibold">{formatCurrency(transaction.amount)}</td>
							<td>
								<span class="badge {getStatusBadge(transaction.status)}">
									{transaction.status}
								</span>
							</td>
							<td class="text-sm">
								{formatPaymentMethod(transaction.payment_method)}
							</td>
							<td class="text-sm">
								{formatShortDate(transaction.completed_at || transaction.created_at)}
							</td>
							<td>
								<a href="/transaction/{transaction.order_id}" class="btn btn-ghost btn-xs">
									Detail
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Tidak ada transaksi {filter !== 'all' ? `dengan status ${filter}` : ''}.</span>
		</div>
	{/if}
</div>
