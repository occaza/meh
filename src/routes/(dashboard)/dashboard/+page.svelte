<script lang="ts">
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/utils/format.utils';
	import {
		DollarSign,
		Package,
		CreditCard,
		CircleCheck,
		Clock,
		TriangleAlert
	} from '@lucide/svelte';

	let stats = $state({
		totalProducts: 0,
		totalTransactions: 0,
		completedTransactions: 0,
		pendingTransactions: 0,
		totalRevenue: 0
	});

	type LowStockProduct = {
		id: string;
		name: string;
		stock: number;
	};

	let lowStockProducts = $state<LowStockProduct[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const [statsRes, lowStockRes] = await Promise.all([
				fetch('/api/admin/stats'),
				fetch('/api/admin/low-stock')
			]);

			const statsData = await statsRes.json();
			stats = statsData;

			if (lowStockRes.ok) {
				const lowStockData = await lowStockRes.json();
				lowStockProducts = lowStockData;
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div>
	<h1 class="mb-8 text-3xl font-bold">Dashboard</h1>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-accent">
						<DollarSign size={32} />
					</div>
					<div class="stat-title">Total Pendapatan</div>
					<div class="stat-value text-accent">
						{formatCurrency(stats.totalRevenue)}
					</div>
					<div class="stat-desc">Dari transaksi yang selesai</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-primary">
						<Package size={32} />
					</div>
					<div class="stat-title">Total Produk</div>
					<div class="stat-value text-primary">{stats.totalProducts}</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-secondary">
						<CreditCard size={32} />
					</div>
					<div class="stat-title">Total Transaksi</div>
					<div class="stat-value text-secondary">{stats.totalTransactions}</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-success">
						<CircleCheck size={32} />
					</div>
					<div class="stat-title">Transaksi Selesai</div>
					<div class="stat-value text-success">{stats.completedTransactions}</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-warning">
						<Clock size={32} />
					</div>
					<div class="stat-title">Transaksi Pending</div>
					<div class="stat-value text-warning">{stats.pendingTransactions}</div>
				</div>
			</div>
		</div>

		<div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Quick Actions</h2>
					<div class="space-y-2">
						<a href="/products/add-new" class="btn btn-block btn-primary">
							<Package size={20} />
							Tambah Produk Baru
						</a>
						<a href="/transaction" class="btn btn-block btn-outline">
							<CreditCard size={20} />
							Lihat Semua Transaksi
						</a>
					</div>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title flex items-center gap-2">
						<TriangleAlert size={20} class="text-warning" />
						Stok Menipis
					</h2>

					{#if lowStockProducts.length > 0}
						<div class="space-y-2">
							{#each lowStockProducts as product}
								<div class="flex items-center justify-between rounded-lg bg-base-200 p-3">
									<div>
										<div class="font-semibold">{product.name}</div>
										<div class="text-sm text-base-content/70">
											Tersisa {product.stock} unit
										</div>
									</div>
									<a href="/products/{product.id}" class="btn btn-ghost btn-sm"> Edit </a>
								</div>
							{/each}
						</div>
					{:else}
						<div class="alert alert-success">
							<CircleCheck size={20} />
							<span>Semua produk stoknya aman</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
