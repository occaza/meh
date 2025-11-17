<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { formatCurrency, formatDate } from '$lib/utils/format.utils';
	import { formatPaymentMethod } from '$lib/utils/payment.utils';

	let { data } = $props();

	let orders = $derived(data.orders);
	let completing = $state<string | null>(null);
	let notificationSound: HTMLAudioElement;
	let previousOrderCount = $state(0);

	onMount(() => {
		// Setup notification sound
		notificationSound = new Audio('/notification_3.wav');

		// Set initial count
		previousOrderCount = orders.length;

		// Auto refresh setiap 10 detik
		const interval = setInterval(async () => {
			const oldCount = orders.length;
			await invalidate('app:orders-processing');

			// Cek apakah ada order baru setelah refresh
			// Kita cek di $effect nanti
		}, 10000);

		// Request notification permission
		if (Notification.permission === 'default') {
			Notification.requestPermission();
		}

		return () => clearInterval(interval);
	});

	// Deteksi order baru dengan effect
	$effect(() => {
		if (orders.length > previousOrderCount) {
			// Ada order baru
			const newOrdersCount = orders.length - previousOrderCount;

			// Play sound
			if (notificationSound) {
				notificationSound.play().catch((e) => console.log('Sound play failed:', e));
			}

			// Browser notification
			if (Notification.permission === 'granted') {
				new Notification('Order Baru!', {
					body: `Ada ${newOrdersCount} pesanan baru yang perlu diproses`,
					icon: '/favicon.svg'
				});
			}
		}

		// Update previous count
		previousOrderCount = orders.length;
	});

	async function loadOrders() {
		await invalidate('app:orders-processing');
	}

	async function completeOrder(orderId: string) {
		if (!confirm('Tandai pesanan ini sebagai selesai?')) return;

		completing = orderId;
		try {
			const res = await fetch(`/api/admin/orders/${orderId}/complete`, {
				method: 'POST'
			});

			if (res.ok) {
				await loadOrders();
				alert('Pesanan berhasil diselesaikan');
			} else {
				const data = await res.json();
				alert(data.error || 'Gagal menyelesaikan pesanan');
			}
		} catch (error) {
			console.error('Complete order error:', error);
			alert('Terjadi kesalahan');
		} finally {
			completing = null;
		}
	}
</script>

<div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Pesanan Diproses</h1>
			<p class="text-base-content/70">
				{orders.length} pesanan menunggu konfirmasi
			</p>
		</div>
		<button class="btn btn-ghost" onclick={loadOrders}>
			<span>🔄</span>
			Refresh
		</button>
	</div>

	{#if orders.length === 0}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body items-center py-16 text-center">
				<div class="mb-4 text-6xl">📦</div>
				<h2 class="mb-2 text-2xl font-bold">Tidak Ada Pesanan</h2>
				<p class="text-base-content/70">Semua pesanan sudah diproses</p>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each orders as order}
				<div class="card border-2 border-warning bg-base-100 shadow-xl">
					<div class="card-body">
						<div class="flex items-center justify-between">
							<div>
								<div class="flex items-center gap-2">
									<span class="font-mono text-lg font-bold">{order.order_id}</span>
									<span class="badge animate-pulse badge-warning"> PERLU DIPROSES </span>
								</div>
								<div class="mt-1 text-sm text-base-content/70">
									Dibayar: {formatDate(order.processing_started_at)}
								</div>
							</div>

							<div class="text-right">
								<div class="text-sm text-base-content/70">Total</div>
								<div class="text-2xl font-bold text-primary">
									{formatCurrency(order.total)}
								</div>
							</div>
						</div>

						<div class="divider"></div>

						<div class="space-y-3">
							{#each order.items as item}
								<div class="flex gap-4">
									<div class="h-16 w-16 overflow-hidden rounded-lg border">
										<img
											src={item.product.images?.[0] || 'https://placehold.co/100'}
											alt={item.product.name}
											class="h-full w-full object-cover"
										/>
									</div>
									<div class="flex-1">
										<div class="font-semibold">{item.product.name}</div>
										<div class="text-sm text-base-content/70">
											{formatCurrency(item.amount)}
										</div>
										{#if item.note}
											<div class="mt-2 rounded bg-warning/20 p-2">
												<div
													class="text-md flex items-center gap-1 font-semibold text-warning-content/70"
												>
													<span>Catatan pembeli:</span>
												</div>

												<div class="text-sm">{item.note}</div>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-4 flex items-center gap-2 text-sm text-base-content/70">
							<span>Metode:</span>
							<span class="font-semibold">{formatPaymentMethod(order.payment_method)}</span>
						</div>

						<div class="card-actions justify-end">
							<button
								class="btn btn-success"
								onclick={() => completeOrder(order.order_id)}
								disabled={completing === order.order_id}
							>
								{#if completing === order.order_id}
									<span class="loading loading-sm loading-spinner"></span>
									Memproses...
								{:else}
									✓ Selesaikan Pesanan
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
