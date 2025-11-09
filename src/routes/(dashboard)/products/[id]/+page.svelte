<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let name = $state('');
	let description = $state('');
	let price = $state(0);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	const productId = $derived($page.params.id);

	onMount(async () => {
		try {
			const res = await fetch(`/api/admin/products/${productId}`);

			if (!res.ok) {
				error = 'Produk tidak ditemukan';
				return;
			}

			const data = await res.json();
			name = data.name;
			description = data.description;
			price = data.price;
		} catch (err) {
			console.error('Failed to load product:', err);
			error = 'Gagal memuat produk';
		} finally {
			loading = false;
		}
	});

	async function handleSubmit() {
		saving = true;
		error = '';

		// Validasi
		if (!name.trim()) {
			error = 'Nama produk harus diisi';
			saving = false;
			return;
		}

		if (!description.trim()) {
			error = 'Deskripsi harus diisi';
			saving = false;
			return;
		}

		if (price <= 0) {
			error = 'Harga harus lebih dari 0';
			saving = false;
			return;
		}

		try {
			const res = await fetch(`/api/admin/products/${productId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, description, price })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Gagal mengupdate produk';
				return;
			}

			// Sukses, redirect ke halaman produk
			goto('/products');
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'Terjadi kesalahan';
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-8">
		<a href="/products" class="btn btn-ghost btn-sm">
			<span>←</span>
			Kembali
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if error && !name}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{:else}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-2xl">Edit Produk</h2>

				{#if error}
					<div class="alert alert-error">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 shrink-0 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{error}</span>
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text">Nama Produk</span>
						</label>
						<input
							id="name"
							type="text"
							placeholder="Contoh: Paket Premium"
							class="input-bordered input"
							bind:value={name}
							required
						/>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="description">
							<span class="label-text">Deskripsi</span>
						</label>
						<textarea
							id="description"
							placeholder="Jelaskan detail produk..."
							class="textarea-bordered textarea h-24"
							bind:value={description}
							required
						></textarea>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="price">
							<span class="label-text">Harga (Rp)</span>
						</label>
						<input
							id="price"
							type="number"
							placeholder="50000"
							class="input-bordered input"
							bind:value={price}
							min="1"
							step="1"
							required
						/>
						<div class="label">
							<span class="label-text-alt">Masukkan harga dalam Rupiah</span>
						</div>
					</div>

					<div class="divider"></div>

					<div class="card-actions justify-end">
						<button type="button" class="btn btn-ghost" onclick={() => goto('/products')}>
							Batal
						</button>
						<button type="submit" class="btn btn-primary" disabled={saving}>
							{#if saving}
								<span class="loading loading-sm loading-spinner"></span>
								Menyimpan...
							{:else}
								<span>💾</span>
								Update Produk
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
