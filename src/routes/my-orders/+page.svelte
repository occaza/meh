<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Navbar, formatCurrency, formatDate } from '$lib';
	// import { authUser } from '$lib/stores/auth.store';
	import { getStatusBadge, getStatusText } from '$lib/utils/status.utils';

	let { data } = $props();

	type OrderItem = {
		product: {
			id: string;
			name: string;
			images?: string[];
			price: number;
		};
		amount: number;
	};

	type Order = {
		order_id: string;
		status: string;
		payment_method?: string;
		completed_at?: string;
		created_at: string;
		items: OrderItem[];
		total: number;
	};

	let orders = $state<Order[]>([]);
	let loading = $state(true);
	let filter = $state('all');

	// Ganti ini
	const user = $derived(data.user);

	onMount(async () => {
		if (!user) {
			goto('/login');
			return;
		}

		await loadOrders();
	});

	async function loadOrders() {
		if (!user) return;

		loading = true;
		try {
			const res = await fetch(`/api/my-orders?user_id=${user.id}`);
			if (res.ok) {
				const data = await res.json();
				orders = data;
			}
		} catch (error) {
			console.error('Failed to load orders:', error);
		} finally {
			loading = false;
		}
	}

	const filteredOrders = $derived(
		filter === 'all' ? orders : orders.filter((o) => o.status === filter)
	);
</script>

<div class="min-h-screen bg-base-200">
	<Navbar />

	<div class="container mx-auto px-4 py-8">
		<h1 class="mb-6 text-3xl font-bold">Pesanan Saya</h1>

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
				class:btn-primary={filter === 'pending'}
				onclick={() => (filter = 'pending')}
			>
				Menunggu Pembayaran
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
				class:btn-primary={filter === 'failed'}
				onclick={() => (filter = 'failed')}
			>
				Gagal
			</button>
		</div>

		{#if loading}
			<div class="flex justify-center py-20">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if filteredOrders.length === 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body items-center py-16 text-center">
					<div class="mb-4 text-6xl">📦</div>
					<h2 class="mb-2 text-2xl font-bold">
						{filter === 'all' ? 'Belum Ada Pesanan' : `Tidak ada pesanan ${filter}`}
					</h2>
					<p class="mb-8 text-base-content/70">Mulai berbelanja sekarang!</p>
					<a href="/shop" class="btn btn-primary">
						<span>🛍️</span>
						Belanja Sekarang
					</a>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredOrders as order}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div>
									<div class="flex items-center gap-2">
										<span class="font-mono text-sm font-semibold">{order.order_id}</span>
										<span class="badge {getStatusBadge(order.status)}">
											{getStatusText(order.status)}
										</span>
									</div>
									<div class="mt-1 text-sm text-base-content/70">
										{formatDate(order.created_at)}
									</div>
								</div>

								<div class="text-right">
									<div class="text-sm text-base-content/70">Total Pembayaran</div>
									<div class="text-2xl font-bold text-primary">
										{formatCurrency(order.total)}
									</div>
								</div>
							</div>

							<div class="divider"></div>

							<div class="space-y-3">
								{#each order.items as item}
									<div class="flex gap-4">
										<div class="h-16 w-16 overflow-hidden rounded-lg border border-base-300">
											<img
												src={item.product.images?.[0] ||
													'https://placehold.co/100x100?text=No+Image'}
												alt={item.product.name}
												class="h-full w-full object-cover"
											/>
										</div>

										<div class="flex-1">
											<div class="font-semibold">{item.product.name}</div>
											<div class="text-sm text-base-content/70">
												{formatCurrency(item.amount)}
											</div>
										</div>
									</div>
								{/each}
							</div>

							{#if order.payment_method}
								<div class="mt-4 flex items-center gap-2 text-sm text-base-content/70">
									<span>Metode Pembayaran:</span>
									<span class="font-semibold">{order.payment_method}</span>
								</div>
							{/if}

							{#if order.status === 'completed' && order.completed_at}
								<div class="mt-2 flex items-center gap-2 text-sm text-base-content/70">
									<span>Dibayar pada:</span>
									<span class="font-semibold">{formatDate(order.completed_at)}</span>
								</div>
							{/if}

							{#if order.status === 'pending'}
								<div class="card-actions justify-end">
									<a href="/payment/{order.order_id}" class="btn btn-sm btn-primary">
										💳 Bayar Sekarang
									</a>
									<button class="btn btn-outline btn-sm" onclick={() => loadOrders()}>
										🔄 Refresh Status
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
