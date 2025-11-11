<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { uploadProductImage, deleteProductImage } from '$lib/utils/upload.utils';
	import type { UploadResult } from '$lib/utils/upload.utils';

	let name = $state('');
	let description = $state('');
	let detailDescription = $state('');
	let price = $state(0);
	let stock = $state(0);
	let discountPercentage = $state(0);
	let discountEndDate = $state('');
	let existingImages = $state<string[]>([]);
	let imageFiles = $state<FileList | null>(null);
	let imagePreviewUrls = $state<string[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let uploadingImages = $state(false);
	let error = $state('');
	let uploadErrors = $state<string[]>([]);

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
			detailDescription = data.detail_description || '';
			price = data.price;
			stock = data.stock || 0;
			discountPercentage = data.discount_percentage || 0;
			discountEndDate = data.discount_end_date || '';
			existingImages = data.images || [];
		} catch (err) {
			console.error('Failed to load product:', err);
			error = 'Gagal memuat produk';
		} finally {
			loading = false;
		}
	});

	function handleImageChange(e: Event) {
		const target = e.target as HTMLInputElement;
		imageFiles = target.files;
		uploadErrors = [];

		if (imageFiles) {
			// Validasi jumlah total gambar
			const totalImages = existingImages.length + imageFiles.length;
			if (totalImages > 3) {
				uploadErrors = [
					`Total gambar tidak boleh lebih dari 3. Anda sudah punya ${existingImages.length} gambar.`
				];
				target.value = '';
				imageFiles = null;
				imagePreviewUrls = [];
				return;
			}

			// Validasi setiap file
			const errors: string[] = [];
			const validFiles: File[] = [];

			Array.from(imageFiles).forEach((file) => {
				const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
				if (!allowedTypes.includes(file.type)) {
					errors.push(`${file.name}: Format tidak didukung`);
					return;
				}

				const maxSize = 5 * 1024 * 1024;
				if (file.size > maxSize) {
					const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
					errors.push(`${file.name}: Terlalu besar (${sizeMB}MB). Max 5MB`);
					return;
				}

				validFiles.push(file);
			});

			if (errors.length > 0) {
				uploadErrors = errors;
			}

			imagePreviewUrls = [];
			validFiles.forEach((file) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					if (e.target?.result) {
						imagePreviewUrls = [...imagePreviewUrls, e.target.result as string];
					}
				};
				reader.readAsDataURL(file);
			});
		}
	}

	async function removeExistingImage(imageUrl: string) {
		if (!confirm('Hapus gambar ini?')) return;
		existingImages = existingImages.filter((img) => img !== imageUrl);
	}

	async function handleSubmit() {
		saving = true;
		error = '';
		uploadErrors = [];

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

		if (stock < 0) {
			error = 'Stok tidak boleh negatif';
			saving = false;
			return;
		}

		if (discountPercentage < 0 || discountPercentage > 100) {
			error = 'Diskon harus antara 0-100%';
			saving = false;
			return;
		}

		try {
			let newImageUrls: string[] = [];

			if (imageFiles && imageFiles.length > 0) {
				uploadingImages = true;
				const uploadPromises = Array.from(imageFiles).map((file) => uploadProductImage(file));
				const results: UploadResult[] = await Promise.all(uploadPromises);

				const errors: string[] = [];
				results.forEach((result) => {
					if (result.success && result.url) {
						newImageUrls.push(result.url);
					} else if (result.error) {
						errors.push(result.error);
					}
				});

				uploadingImages = false;

				if (errors.length > 0) {
					uploadErrors = errors;
					saving = false;
					return;
				}
			}

			const allImages = [...existingImages, ...newImageUrls];

			const res = await fetch(`/api/admin/products/${productId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					description,
					detail_description: detailDescription || description,
					price,
					stock,
					discount_percentage: discountPercentage,
					discount_end_date: discountEndDate || null,
					images: allImages
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Gagal mengupdate produk';
				return;
			}

			goto('/products');
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'Terjadi kesalahan';
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-auto max-w-4xl">
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

				{#if uploadErrors.length > 0}
					<div class="alert alert-warning">
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
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<div>
							<div class="font-semibold">Beberapa gambar tidak dapat diupload:</div>
							<ul class="mt-1 list-inside list-disc text-sm">
								{#each uploadErrors as err}
									<li>{err}</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					{#if existingImages.length > 0}
						<div class="form-control">
							<label class="label" for="existingImages">
								<span class="label-text">Gambar Saat Ini</span>
							</label>
							<div class="flex flex-wrap gap-4">
								{#each existingImages as imageUrl}
									<div class="relative">
										<div class="h-32 w-32 overflow-hidden rounded-lg border-2 border-base-300">
											<img src={imageUrl} alt="Product" class="h-full w-full object-cover" />
										</div>
										<button
											type="button"
											class="btn absolute top-1 right-1 btn-circle btn-xs btn-error"
											onclick={() => removeExistingImage(imageUrl)}
										>
											✕
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="form-control mt-4">
						<label class="label" for="images">
							<span class="label-text">Tambah Gambar Baru (Max 3 total)</span>
						</label>
						<input
							id="images"
							type="file"
							accept="image/*"
							multiple
							class="file-input-bordered file-input w-full"
							onchange={handleImageChange}
							disabled={loading || existingImages.length >= 3}
						/>
						<div class="label">
							<span class="label-text-alt">
								Format: JPG, PNG, WEBP. Max 5MB per gambar.
								{#if existingImages.length >= 3}
									Sudah mencapai batas maksimal gambar.
								{:else}
									Anda bisa menambah {3 - existingImages.length} gambar lagi.
								{/if}
							</span>
						</div>

						{#if imagePreviewUrls.length > 0}
							<div class="mt-4 flex gap-4">
								{#each imagePreviewUrls as url}
									<div class="h-32 w-32 overflow-hidden rounded-lg border-2 border-base-300">
										<img src={url} alt="Preview" class="h-full w-full object-cover" />
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="divider"></div>

					<!-- Sisanya sama seperti sebelumnya -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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

						<div class="form-control">
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
						</div>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="description">
							<span class="label-text">Deskripsi Singkat</span>
						</label>
						<textarea
							id="description"
							placeholder="Deskripsi singkat untuk card produk..."
							class="textarea-bordered textarea h-20"
							bind:value={description}
							required
						></textarea>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="detailDescription">
							<span class="label-text">Detail Produk</span>
						</label>
						<textarea
							id="detailDescription"
							placeholder="Detail lengkap tentang produk..."
							class="textarea-bordered textarea h-32"
							bind:value={detailDescription}
						></textarea>
					</div>

					<div class="divider"></div>

					<!-- Stock & Discount -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="form-control">
							<label class="label" for="stock">
								<span class="label-text">Stok</span>
							</label>
							<input
								id="stock"
								type="number"
								placeholder="100"
								class="input-bordered input"
								bind:value={stock}
								min="0"
								step="1"
								required
							/>
							<div class="label">
								<span class="label-text-alt">Gunakan 999999 untuk unlimited</span>
							</div>
						</div>

						<div class="form-control">
							<label class="label" for="discount">
								<span class="label-text">Diskon (%)</span>
							</label>
							<input
								id="discount"
								type="number"
								placeholder="0"
								class="input-bordered input"
								bind:value={discountPercentage}
								min="0"
								max="100"
								step="1"
							/>
						</div>
					</div>

					{#if discountPercentage > 0}
						<div class="form-control mt-4">
							<label class="label" for="discountEndDate">
								<span class="label-text">Berlaku Sampai</span>
							</label>
							<input
								id="discountEndDate"
								type="datetime-local"
								class="input-bordered input"
								bind:value={discountEndDate}
							/>
							<div class="label">
								<span class="label-text-alt">Opsional. Kosongkan jika tanpa batas waktu.</span>
							</div>
						</div>
					{/if}

					<div class="divider"></div>

					<div class="card-actions justify-end">
						<button type="button" class="btn btn-ghost" onclick={() => goto('/products')}>
							Batal
						</button>
						<button type="submit" class="btn btn-primary" disabled={saving || uploadingImages}>
							{#if uploadingImages}
								<span class="loading loading-sm loading-spinner"></span>
								Upload Gambar...
							{:else if saving}
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
