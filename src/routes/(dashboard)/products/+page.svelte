<!-- src/routes/(dashboard)/products/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Product } from '$lib/types/types';
	import { formatCurrency } from '$lib/utils/format.utils';
	import { SquarePen, Trash2, PackagePlus } from '@lucide/svelte';

	let products = $state<Product[]>([]);
	let loading = $state(true);
	let deleteLoading = $state<string | null>(null);

	onMount(async () => {
		await loadProducts();
	});

	async function loadProducts() {
		try {
			const res = await fetch('/api/products');
			const data = await res.json();
			products = data;
		} catch (error) {
			console.error('Failed to fetch products:', error);
		} finally {
			loading = false;
		}
	}

	async function deleteProduct(id: string) {
		if (!confirm('Yakin ingin menghapus produk ini?')) return;

		deleteLoading = id;
		try {
			const res = await fetch(`/api/admin/products/${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				await loadProducts();
			} else {
				alert('Gagal menghapus produk');
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('Terjadi kesalahan');
		} finally {
			deleteLoading = null;
		}
	}
</script>

<div>
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Produk</h1>
		<a href="/products/add-new" class="btn btn-primary">
			<PackagePlus />
			Tambah Produk
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if products.length}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
			{#each products as product}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">{product.name}</h2>
						<p class="text-base-content/70">{product.description}</p>
						<div class="my-2 text-2xl font-bold text-primary">
							{formatCurrency(product.price)}
						</div>
						<div class="card-actions justify-end">
							<a href="/products/{product.id}" class="btn btn-outline btn-sm">
								<SquarePen size="16" />
								Edit
							</a>
							<button
								class="btn btn-sm btn-error"
								onclick={() => deleteProduct(product.id)}
								disabled={deleteLoading === product.id}
							>
								{#if deleteLoading === product.id}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									<Trash2 size="16" />
									Hapus
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Belum ada produk. Tambahkan produk pertama Anda!</span>
		</div>
	{/if}
</div>
