<script lang="ts">
	import { onMount } from 'svelte';

	let transaction: { status: string; amount: number } | null = null;
	let loading = true;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		const orderId = urlParams.get('order_id');

		if (!orderId) {
			loading = false;
			return;
		}

		const res = await fetch(`/api/transaction/${orderId}`);
		const data = await res.json();

		if (res.ok) {
			transaction = data;
		}
		loading = false;
	});
</script>

<main>
	{#if loading}
		<p>Memverifikasi pembayaran...</p>
	{:else if transaction && transaction.status === 'completed'}
		<h1>✅ Pembayaran Berhasil!</h1>
		<p>Total: Rp{transaction.amount.toLocaleString('id-ID')}</p>
	{:else}
		<h1>❌ Pembayaran belum berhasil</h1>
		<p>Silakan coba lagi atau hubungi kami.</p>
	{/if}
</main>
