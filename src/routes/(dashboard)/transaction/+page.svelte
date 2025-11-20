<script lang="ts">
	import { onMount } from 'svelte';
	import { formatCurrency, formatShortDate } from '$lib/utils/format.utils';
	import { getStatusBadge, getStatusText } from '$lib/utils/status.utils';
	import { formatPaymentMethod } from '$lib/utils/payment.utils';
	import { Search, ChevronLeft, ChevronRight, Calendar, X } from '@lucide/svelte';

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

	type GroupedTransaction = {
		order_id: string;
		total_amount: number;
		status: string;
		payment_method?: string;
		completed_at?: string;
		created_at: string;
		products: string[];
		product_count: number;
		buyer_name?: string; // Tambah ini
	};

	let transactions = $state<TransactionWithProduct[]>([]);
	let loading = $state(true);
	let filter = $state('all');
	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);
	let startDate = $state('');
	let endDate = $state('');
	let showDateFilter = $state(false);

	const perPageOptions = [10, 25, 50, 100];

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

	// Group transactions by order_id
	const groupedTransactions = $derived(() => {
		const grouped = new Map<string, GroupedTransaction>();

		transactions.forEach((transaction) => {
			const existing = grouped.get(transaction.order_id);

			if (existing) {
				existing.total_amount += transaction.amount;
				existing.products.push(transaction.product.name);
				existing.product_count++;
			} else {
				grouped.set(transaction.order_id, {
					order_id: transaction.order_id,
					total_amount: transaction.amount,
					status: transaction.status,
					payment_method: transaction.payment_method,
					completed_at: transaction.completed_at,
					created_at: transaction.created_at,
					products: [transaction.product.name],
					product_count: 1,
					buyer_name: transaction.buyer_name
				});
			}
		});

		return Array.from(grouped.values()).sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
	});

	// Filter berdasarkan status
	const statusFiltered = $derived(
		filter === 'all'
			? groupedTransactions()
			: groupedTransactions().filter((t) => t.status === filter)
	);

	// Filter berdasarkan date range
	const dateFiltered = $derived(() => {
		if (!startDate && !endDate) {
			return statusFiltered;
		}

		return statusFiltered.filter((transaction) => {
			const transactionDate = new Date(transaction.created_at);

			// Set time to start of day untuk comparison yang akurat
			if (startDate) {
				const start = new Date(startDate);
				start.setHours(0, 0, 0, 0);
				if (transactionDate < start) {
					return false;
				}
			}

			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				if (transactionDate > end) {
					return false;
				}
			}

			return true;
		});
	});

	// Filter berdasarkan search query
	const searchFiltered = $derived(() => {
		if (!searchQuery.trim()) {
			return dateFiltered();
		}

		const query = searchQuery.toLowerCase().trim();

		return dateFiltered().filter((transaction) => {
			if (transaction.order_id.toLowerCase().includes(query)) {
				return true;
			}

			if (transaction.products.some((product) => product.toLowerCase().includes(query))) {
				return true;
			}

			if (
				transaction.payment_method &&
				formatPaymentMethod(transaction.payment_method).toLowerCase().includes(query)
			) {
				return true;
			}

			if (getStatusText(transaction.status).toLowerCase().includes(query)) {
				return true;
			}

			return false;
		});
	});

	// Pagination
	const totalItems = $derived(searchFiltered().length);
	const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	const paginatedTransactions = $derived(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return searchFiltered().slice(start, end);
	});

	const startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	const endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	// Hitung jumlah untuk setiap status
	const statusCounts = $derived(() => {
		const all = groupedTransactions();
		return {
			all: all.length,
			completed: all.filter((t) => t.status === 'completed').length,
			processing: all.filter((t) => t.status === 'processing').length,
			pending: all.filter((t) => t.status === 'pending').length,
			failed: all.filter((t) => t.status === 'failed').length,
			expired: all.filter((t) => t.status === 'expired').length
		};
	});

	// Check apakah ada date filter aktif
	const hasDateFilter = $derived(startDate !== '' || endDate !== '');

	function clearSearch() {
		searchQuery = '';
		currentPage = 1;
	}

	function clearDateFilter() {
		startDate = '';
		endDate = '';
		currentPage = 1;
	}

	function applyQuickDateFilter(days: number) {
		const today = new Date();
		const start = new Date();
		start.setDate(today.getDate() - days);

		startDate = start.toISOString().split('T')[0];
		endDate = today.toISOString().split('T')[0];
		currentPage = 1;
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function changeItemsPerPage(newValue: number) {
		itemsPerPage = newValue;
		currentPage = 1;
	}

	// Reset ke halaman 1 saat filter atau search berubah
	$effect(() => {
		if (filter || searchQuery || startDate || endDate) {
			currentPage = 1;
		}
	});

	// Generate page numbers untuk pagination
	const pageNumbers = $derived(() => {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			}
		}

		return pages;
	});
</script>

<div>
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Transaksi</h1>
		<button class="btn btn-ghost" onclick={loadTransactions}>
			<span>🔄</span>
			Refresh
		</button>
	</div>

	<!-- Search Bar -->
	<div class="mb-4">
		<div class="relative">
			<Search class="absolute top-3 left-3 text-base-content/50" size={20} />
			<input
				type="text"
				placeholder="Cari Order ID, produk, metode pembayaran, atau status..."
				class="input-bordered input w-full pr-10 pl-10"
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button
					class="btn absolute top-1 right-1 btn-circle btn-ghost btn-sm"
					onclick={clearSearch}
				>
					✕
				</button>
			{/if}
		</div>
		{#if searchQuery && searchFiltered().length > 0}
			<div class="mt-2 text-sm text-base-content/70">
				Ditemukan {searchFiltered().length} transaksi
			</div>
		{:else if searchQuery && searchFiltered().length === 0}
			<div class="mt-2 text-sm text-error">
				Tidak ditemukan transaksi dengan kata kunci "{searchQuery}"
			</div>
		{/if}
	</div>

	<!-- Filter Buttons -->
	<div class="mb-6 flex flex-wrap gap-2">
		<button
			class="btn gap-2 btn-sm"
			class:btn-primary={hasDateFilter}
			onclick={() => (showDateFilter = !showDateFilter)}
		>
			<Calendar size={16} />
			Filter Tanggal
			{#if hasDateFilter}
				<span class="badge badge-sm">Aktif</span>
			{/if}
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'all'}
			onclick={() => (filter = 'all')}
		>
			Semua
			{#if statusCounts().all > 0}
				<span class="badge badge-sm">{statusCounts().all}</span>
			{/if}
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'completed'}
			onclick={() => (filter = 'completed')}
		>
			Selesai
			{#if statusCounts().completed > 0}
				<span class="badge badge-sm">{statusCounts().completed}</span>
			{/if}
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'processing'}
			onclick={() => (filter = 'processing')}
		>
			Diproses
			{#if statusCounts().processing > 0}
				<span class="badge badge-sm">{statusCounts().processing}</span>
			{/if}
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'pending'}
			onclick={() => (filter = 'pending')}
		>
			Pending
			{#if statusCounts().pending > 0}
				<span class="badge badge-sm">{statusCounts().pending}</span>
			{/if}
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'failed'}
			onclick={() => (filter = 'failed')}
		>
			Gagal
			{#if statusCounts().failed > 0}
				<span class="badge badge-sm">{statusCounts().failed}</span>
			{/if}
		</button>
		<button
			class="btn btn-sm"
			class:btn-primary={filter === 'expired'}
			onclick={() => (filter = 'expired')}
		>
			Kadaluarsa
			{#if statusCounts().expired > 0}
				<span class="badge badge-sm">{statusCounts().expired}</span>
			{/if}
		</button>
	</div>

	<!-- Date Filter -->
	<div class="mb-4">
		{#if showDateFilter}
			<div class="card mt-2 bg-base-100 shadow-lg">
				<div class="card-body p-4">
					<div class="flex flex-col gap-4 md:flex-row md:items-end">
						<div class="form-control flex-1">
							<label class="label" for="start-date">
								<span class="label-text">Dari Tanggal</span>
							</label>
							<input
								id="start-date"
								type="date"
								class="input-bordered input input-sm"
								bind:value={startDate}
							/>
						</div>

						<div class="form-control flex-1">
							<label class="label" for="end-date">
								<span class="label-text">Sampai Tanggal</span>
							</label>
							<input
								id="end-date"
								type="date"
								class="input-bordered input input-sm"
								bind:value={endDate}
							/>
						</div>

						{#if hasDateFilter}
							<button class="btn gap-2 btn-sm btn-error" onclick={clearDateFilter}>
								<X size={16} />
								Reset
							</button>
						{/if}
					</div>

					<div class="divider my-2">Quick Filter</div>

					<div class="flex flex-wrap gap-2">
						<button class="btn btn-outline btn-xs" onclick={() => applyQuickDateFilter(0)}>
							Hari Ini
						</button>
						<button class="btn btn-outline btn-xs" onclick={() => applyQuickDateFilter(7)}>
							7 Hari Terakhir
						</button>
						<button class="btn btn-outline btn-xs" onclick={() => applyQuickDateFilter(30)}>
							30 Hari Terakhir
						</button>
						<button class="btn btn-outline btn-xs" onclick={() => applyQuickDateFilter(90)}>
							90 Hari Terakhir
						</button>
					</div>

					{#if hasDateFilter}
						<div class="mt-3 text-sm text-base-content/70">
							Filter aktif: {startDate ? new Date(startDate).toLocaleDateString('id-ID') : 'Awal'}
							sampai
							{endDate ? new Date(endDate).toLocaleDateString('id-ID') : 'Sekarang'}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if searchFiltered().length > 0}
		<!-- Per Page Selector -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-sm text-base-content/70">Tampilkan</span>
				<select
					class="select-bordered select w-20 select-sm"
					bind:value={itemsPerPage}
					onchange={() => changeItemsPerPage(itemsPerPage)}
				>
					{#each perPageOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<span class="text-sm text-base-content/70">data per halaman</span>
			</div>

			<div class="text-sm text-base-content/70">
				Menampilkan {startItem} - {endItem} dari {totalItems} transaksi
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Order ID</th>
						<th>Pembeli</th>
						<th>Produk</th>
						<th>Total Amount</th>
						<th>Status</th>
						<th>Metode</th>
						<th>Tanggal</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedTransactions() as transaction}
						<tr class="hover">
							<td class="font-mono text-sm">{transaction.order_id}</td>
							<td class="text-sm">{transaction.buyer_name || 'Unknown'}</td>
							<td>
								{#if transaction.product_count === 1}
									<span>{transaction.products[0]}</span>
								{:else}
									<div class="flex flex-col gap-1">
										<span class="font-semibold">{transaction.product_count} produk</span>
										<span class="text-xs text-base-content/70">
											{transaction.products.slice(0, 2).join(', ')}
											{#if transaction.products.length > 2}
												<span>, +{transaction.products.length - 2} lainnya</span>
											{/if}
										</span>
									</div>
								{/if}
							</td>
							<td class="font-semibold">{formatCurrency(transaction.total_amount)}</td>
							<td>
								<span class="badge {getStatusBadge(transaction.status)}">
									{getStatusText(transaction.status)}
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

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-6 flex items-center justify-center gap-2">
				<button
					class="btn btn-sm"
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
				>
					<ChevronLeft size={16} />
					Prev
				</button>

				{#each pageNumbers() as pageNum}
					{#if pageNum === '...'}
						<span class="px-2">...</span>
					{:else}
						<button
							class="btn btn-sm"
							class:btn-primary={currentPage === pageNum}
							onclick={() => goToPage(pageNum as number)}
						>
							{pageNum}
						</button>
					{/if}
				{/each}

				<button
					class="btn btn-sm"
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					Next
					<ChevronRight size={16} />
				</button>
			</div>
		{/if}
	{:else if searchQuery || hasDateFilter}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body items-center py-16 text-center">
				<div class="mb-4 text-6xl">🔍</div>
				<h2 class="mb-2 text-2xl font-bold">Tidak Ditemukan</h2>
				<p class="mb-8 text-base-content/70">
					{#if searchQuery && hasDateFilter}
						Tidak ada transaksi dengan kata kunci "{searchQuery}" pada periode yang dipilih
					{:else if searchQuery}
						Tidak ada transaksi yang cocok dengan "{searchQuery}"
					{:else}
						Tidak ada transaksi pada periode yang dipilih
					{/if}
				</p>
				<div class="flex gap-2">
					{#if searchQuery}
						<button class="btn btn-outline" onclick={clearSearch}> Hapus Pencarian </button>
					{/if}
					{#if hasDateFilter}
						<button class="btn btn-primary" onclick={clearDateFilter}>
							Reset Filter Tanggal
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Tidak ada transaksi dengan status {filter === 'all' ? '' : getStatusText(filter)}</span>
		</div>
	{/if}
</div>
