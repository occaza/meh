<script lang="ts">
	import { onMount } from 'svelte';

	let stats = $state({
		totalProducts: 0,
		totalTransactions: 0,
		completedTransactions: 0,
		pendingTransactions: 0,
		totalRevenue: 0
	});
	let loading = $state(true);

	onMount(async () => {
		try {
			const res = await fetch('/api/admin/stats');
			const data = await res.json();
			stats = data;
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
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-primary">
						<span class="text-4xl">📦</span>
					</div>
					<div class="stat-title">Total Produk</div>
					<div class="stat-value text-primary">{stats.totalProducts}</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-secondary">
						<span class="text-4xl">💳</span>
					</div>
					<div class="stat-title">Total Transaksi</div>
					<div class="stat-value text-secondary">{stats.totalTransactions}</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-success">
						<span class="text-4xl">✅</span>
					</div>
					<div class="stat-title">Transaksi Selesai</div>
					<div class="stat-value text-success">{stats.completedTransactions}</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-warning">
						<span class="text-4xl">⏳</span>
					</div>
					<div class="stat-title">Transaksi Pending</div>
					<div class="stat-value text-warning">{stats.pendingTransactions}</div>
				</div>
			</div>

			<div class="stats shadow md:col-span-2">
				<div class="stat">
					<div class="stat-figure text-accent">
						<span class="text-4xl">💰</span>
					</div>
					<div class="stat-title">Total Pendapatan</div>
					<div class="stat-value text-accent">
						Rp{stats.totalRevenue.toLocaleString('id-ID')}
					</div>
					<div class="stat-desc">Dari transaksi yang selesai</div>
				</div>
			</div>
		</div>

		<div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Quick Actions</h2>
					<div class="space-y-2">
						<a href="/products/add-new" class="btn btn-block btn-primary">
							<span class="text-xl">➕</span>
							Tambah Produk Baru
						</a>
						<a href="/transaction" class="btn btn-block btn-outline">
							<span class="text-xl">📋</span>
							Lihat Semua Transaksi
						</a>
					</div>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Informasi</h2>
					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2">
							<span class="badge badge-info">Info</span>
							<span>Webhook sudah terkonfigurasi</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="badge badge-success">Active</span>
							<span>Integrasi Pakasir aktif</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="badge badge-warning">Dev</span>
							<span>Mode Sandbox untuk testing</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
