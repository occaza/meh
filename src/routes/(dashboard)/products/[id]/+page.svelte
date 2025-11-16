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
	let newImageFiles = $state<File[]>([]);
	let newImagePreviews = $state<string[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let uploadingImages = $state(false);
	let error = $state('');
	let uploadErrors = $state<string[]>([]);
	let faqItems = $state<Array<{ question: string; answer: string }>>([]);

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
			faqItems = data.faq || []; // Tambah baris ini
		} catch (err) {
			console.error('Failed to load product:', err);
			error = 'Gagal memuat produk';
		} finally {
			loading = false;
		}
	});

	function handleAddNewImage() {
		const totalImages = existingImages.length + newImageFiles.length;
		if (totalImages >= 3) return;

		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files[0]) {
				handleNewImageAdd(target.files[0]);
			}
		};
		input.click();
	}

	function handleNewImageAdd(file: File) {
		uploadErrors = [];

		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			uploadErrors = [`Format tidak didukung: ${file.name}`];
			return;
		}

		const maxSize = 100 * 1024;
		if (file.size > maxSize) {
			const sizeMB = (file.size / 1024).toFixed(2);
			uploadErrors = [`File terlalu besar: ${file.name} (${sizeMB}KB). Maksimal 100KB`];
			return;
		}

		newImageFiles = [...newImageFiles, file];

		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result) {
				newImagePreviews = [...newImagePreviews, e.target.result as string];
			}
		};
		reader.readAsDataURL(file);
	}

	function removeExistingImage(imageUrl: string) {
		if (!confirm('Hapus gambar ini?')) return;
		existingImages = existingImages.filter((img) => img !== imageUrl);
	}

	function removeNewImage(index: number) {
		newImageFiles = newImageFiles.filter((_, i) => i !== index);
		newImagePreviews = newImagePreviews.filter((_, i) => i !== index);
	}

	function addFaqItem() {
		faqItems = [...faqItems, { question: '', answer: '' }];
	}

	function removeFaqItem(index: number) {
		faqItems = faqItems.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		saving = true;
		error = '';
		uploadErrors = [];

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
			let uploadedUrls: string[] = [];

			if (newImageFiles.length > 0) {
				uploadingImages = true;
				const uploadPromises = newImageFiles.map((file) => uploadProductImage(file));
				const results = await Promise.all(uploadPromises);

				const errors: string[] = [];
				results.forEach((result) => {
					if (result.success && result.url) {
						uploadedUrls.push(result.url);
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

			const allImages = [...existingImages, ...uploadedUrls];
			console.log('FAQ items before submit:', faqItems);

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
					images: allImages,
					faq: faqItems.length > 0 ? faqItems : null // Pastikan baris ini ada
				})
			});

			const data = await res.json();
			console.log('Response from server:', data);

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
							<div class="font-semibold">Error Upload:</div>
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
					<!-- Section Gambar -->
					<div class="form-control">
						<div class="label">
							<span class="label-text">Gambar Produk</span>
						</div>

						<div class="grid grid-cols-3 gap-4">
							<!-- Existing images -->
							{#each existingImages as url, index}
								<div
									class="relative aspect-square overflow-hidden rounded-lg border-2 border-base-300"
								>
									<img src={url} alt="Existing {index + 1}" class="h-full w-full object-cover" />
									<button
										type="button"
										class="btn absolute top-1 right-1 btn-circle btn-xs btn-error"
										onclick={() => removeExistingImage(url)}
									>
										✕
									</button>
								</div>
							{/each}

							<!-- New images -->
							{#each newImagePreviews as url, index}
								<div
									class="relative aspect-square overflow-hidden rounded-lg border-2 border-primary"
								>
									<img src={url} alt="New {index + 1}" class="h-full w-full object-cover" />
									<button
										type="button"
										class="btn absolute top-1 right-1 btn-circle btn-xs btn-error"
										onclick={() => removeNewImage(index)}
									>
										✕
									</button>
									<div class="absolute bottom-1 left-1 badge badge-sm badge-primary">Baru</div>
								</div>
							{/each}

							<!-- Add button -->
							{#if existingImages.length + newImageFiles.length < 3}
								<button
									type="button"
									class="btn aspect-square flex-col border-2 border-dashed btn-outline"
									onclick={handleAddNewImage}
									disabled={loading}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
									<span class="text-xs">Tambah Foto</span>
								</button>
							{/if}
						</div>

						<div class="label">
							<span class="label-text-alt">
								Format: JPG, PNG, WEBP. Maksimal 100KB per gambar. Total {existingImages.length +
									newImageFiles.length}/3
							</span>
						</div>
					</div>

					<div class="divider"></div>

					<!-- Form fields sisanya sama seperti sebelumnya -->
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

					<div class="form-control">
						<div class="mb-2 flex items-center justify-between">
							<div class="label" role="heading" aria-level="2">
								<span class="label-text">FAQ Produk</span>
							</div>
							<button type="button" class="btn btn-outline btn-sm" onclick={addFaqItem}>
								+ Tambah FAQ
							</button>
						</div>

						{#if faqItems.length > 0}
							<div class="space-y-4">
								{#each faqItems as item, index}
									<div class="rounded-lg border border-base-300 p-4">
										<div class="mb-2 flex items-center justify-between">
											<span class="text-sm font-semibold">FAQ {index + 1}</span>
											<button
												type="button"
												class="btn btn-circle btn-ghost btn-xs"
												onclick={() => removeFaqItem(index)}
											>
												✕
											</button>
										</div>
										<input
											type="text"
											placeholder="Pertanyaan"
											class="input-bordered input input-sm mb-2 w-full"
											bind:value={item.question}
										/>
										<textarea
											placeholder="Jawaban"
											class="textarea-bordered textarea w-full textarea-sm"
											bind:value={item.answer}
										></textarea>
									</div>
								{/each}
							</div>
						{/if}
					</div>

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
