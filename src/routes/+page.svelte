<script lang="ts">
	import { onMount } from 'svelte';

	let products: { id: string; name: string; price: number }[] = [];
	let loading = true;

	onMount(async () => {
		// Fetch products from Supabase (via your own API for security)
		const res = await fetch('/api/products');
		const data = await res.json();
		products = data;
		loading = false;
	});

	async function checkout(productId: string) {
		const orderId = `TEST_${Date.now()}`;
		const res = await fetch('/api/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ product_id: productId, order_id: orderId })
		});
		const { redirectUrl } = await res.json();
		if (redirectUrl) {
			window.location.href = redirectUrl;
		}
	}
</script>

<main>
	<h1>🛒 Produk Kami</h1>
	{#if loading}
		<p>Memuat...</p>
	{:else if products.length}
		{#each products as product}
			<div style="border: 1px solid #ccc; padding: 1rem; margin: 1rem 0;">
				<h2>{product.name}</h2>
				<p>Harga: Rp{product.price.toLocaleString('id-ID')}</p>
				<button on:click={() => checkout(product.id)}>Beli</button>
			</div>
		{/each}
	{:else}
		<p>Tidak ada produk.</p>
	{/if}
</main>
