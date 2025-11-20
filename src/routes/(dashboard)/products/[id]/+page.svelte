<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { uploadProductImage, deleteProductImage } from '$lib/utils/upload.utils';
	// import type { UploadResult } from '$lib/utils/upload.utils';
	import {
		Image,
		Info,
		CircleAlert,
		Box,
		MessageCircleX,
		MessageCircleQuestionMark,
		Save,
		Plus
	} from '@lucide/svelte';

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

<!--div class="mx-auto max-w-5xl"-->
<div>
	<div class="mb-6">
		<a href="/products" class="btn gap-2 btn-ghost">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Kembali
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center py-20">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if error && !name}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{:else}
		<!-- Main Card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body p-8">
				<!-- Title Section -->
				<div class="mb-8">
					<h2 class="text-3xl font-bold">Edit Produk</h2>
					<p class="mt-2 text-base-content/70">Perbarui informasi produk Anda</p>
				</div>

				<!-- Alerts -->
				{#if error}
					<div class="mb-6 alert alert-error">
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
					<div class="mb-6 alert alert-warning">
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
							<div class="font-semibold">Error Upload</div>
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
					<!-- Section 1: Gambar Produk -->
					<div class="mb-6 rounded-lg bg-base-200/50 p-6">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-content"
							>
								<Image strokeWidth={1} />
							</div>
							<div>
								<h3 class="text-lg font-semibold">Gambar Produk</h3>
								<p class="text-sm text-base-content/70">
									Upload hingga 3 foto, maksimal 100KB per foto
								</p>
							</div>
						</div>

						<div class="flex gap-3">
							{#each existingImages as url, index}
								<div
									class="group relative aspect-square w-40 overflow-hidden rounded-xl border-2 border-base-300 bg-base-100"
								>
									<img src={url} alt="Existing {index + 1}" class="h-full w-full object-cover" />
									<button
										type="button"
										class="btn absolute top-2 right-2 btn-circle opacity-0 transition-opacity btn-sm btn-error group-hover:opacity-100"
										onclick={() => removeExistingImage(url)}
										aria-label="Hapus gambar"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>

									<div class="absolute bottom-2 left-2 badge badge-sm badge-success">Tersimpan</div>
								</div>
							{/each}

							{#each newImagePreviews as url, index}
								<div
									class="group relative aspect-square w-40 overflow-hidden rounded-xl border-2 border-primary bg-base-100"
								>
									<img src={url} alt="New {index + 1}" class="h-full w-full object-cover" />
									<button
										type="button"
										class="btn absolute top-2 right-2 btn-circle opacity-0 transition-opacity btn-sm btn-error group-hover:opacity-100"
										onclick={() => removeNewImage(index)}
										aria-label="Hapus gambar baru"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
									<div class="absolute bottom-2 left-2 badge badge-sm badge-primary">Baru</div>
								</div>
							{/each}

							{#if existingImages.length + newImageFiles.length < 3}
								<button
									type="button"
									class="group flex aspect-square w-40 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-300 bg-base-100 transition-all hover:border-primary hover:bg-primary/5"
									onclick={handleAddNewImage}
									disabled={loading}
								>
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-base-200 transition-colors group-hover:bg-primary/20"
									>
										<svg
											class="h-6 w-6 text-base-content/70 group-hover:text-primary"
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
									</div>
									<span class="text-sm font-medium text-base-content/70">Tambah Foto</span>
								</button>
							{/if}
						</div>

						<div class="mt-4 flex items-start gap-2 rounded-lg bg-info/10 p-3">
							<div class="mt-0.5 text-info">
								<Info strokeWidth={2} />
							</div>
							<div class="text-sm">
								<p class="font-medium text-info">Format JPG, PNG, atau WEBP</p>
								<p class="text-base-content/70">
									Ukuran maksimal 100KB per gambar. Total {existingImages.length +
										newImageFiles.length}/3 foto
								</p>
							</div>
						</div>
					</div>

					<div class="mb-6 rounded-lg bg-base-200/50 p-6">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-content"
							>
								<CircleAlert strokeWidth={2} />
							</div>
							<div>
								<h3 class="text-lg font-semibold">Informasi Dasar</h3>
								<p class="text-sm text-base-content/70">Detail produk yang akan ditampilkan</p>
							</div>
						</div>

						<div class="form-control flex flex-col">
							<label class="label" for="name">
								<span class="label-text font-medium">Nama Produk</span>
								<span class="label-text-alt text-error">*</span>
							</label>
							<input
								id="name"
								type="text"
								placeholder="Contoh: Paket Premium"
								class="input-bordered input w-full"
								bind:value={name}
								required
							/>
						</div>

						<div class="form-control mt-4 flex flex-col">
							<label class="label" for="description">
								<span class="label-text font-medium">Deskripsi Singkat</span>
								<span class="label-text-alt text-error">*</span>
							</label>
							<textarea
								id="description"
								placeholder="Deskripsi singkat untuk card produk"
								class="textarea-bordered textarea h-24 w-full resize-none"
								bind:value={description}
								required
							></textarea>
						</div>

						<div class="form-control mt-4 flex flex-col">
							<label class="label" for="detailDescription">
								<span class="label-text font-medium">Detail Produk</span>
								<span class="label-text-alt">Opsional</span>
							</label>
							<textarea
								id="detailDescription"
								placeholder="Detail lengkap tentang produk"
								class="textarea-bordered textarea h-40 w-full resize-none"
								bind:value={detailDescription}
							></textarea>
							<span class="label-text-alt label"
								>Jika kosong, akan menggunakan deskripsi singkat</span
							>
						</div>
					</div>

					<div class="mb-6 rounded-lg bg-base-200/50 p-6">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-content"
							>
								<Box strokeWidth={1} />
							</div>
							<div>
								<h3 class="text-lg font-semibold">Stok & Diskon</h3>
								<p class="text-sm text-base-content/70">Atur ketersediaan dan harga spesial</p>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="form-control flex flex-col">
								<label class="label" for="price">
									<span class="label-text font-medium">Harga</span>
									<span class="label-text-alt text-error">*</span>
								</label>
								<div class="join w-full">
									<span class="btn btn-disabled join-item">Rp</span>
									<input
										id="price"
										type="number"
										placeholder="1000"
										class="input-bordered input join-item w-full"
										bind:value={price}
										min="1"
										step="1"
										required
									/>
								</div>
							</div>
							<div class="form-control flex flex-col">
								<label class="label" for="stock">
									<span class="label-text font-medium">Jumlah Stok</span>
									<span class="label-text-alt text-error">*</span>
								</label>
								<input
									id="stock"
									type="number"
									placeholder="100"
									class="input-bordered input w-full"
									bind:value={stock}
									min="0"
									step="1"
									required
								/>
								<span class="label-text-alt label">Gunakan 999999 untuk unlimited</span>
							</div>
						</div>

						<div class="my-5 grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="form-control flex flex-col">
								<label class="label" for="discount">
									<span class="label-text font-medium">Diskon</span>
								</label>
								<div class="join w-full">
									<input
										id="discount"
										type="number"
										placeholder="0"
										class="input-bordered input join-item w-full"
										bind:value={discountPercentage}
										min="0"
										max="100"
										step="1"
									/>
									<span class="btn btn-disabled join-item">%</span>
								</div>
							</div>

							{#if discountPercentage > 0}
								<div class="form-control flex flex-col">
									<label class="label" for="discountEndDate">
										<span class="label-text font-medium">Berlaku Sampai</span>
									</label>
									<input
										id="discountEndDate"
										type="datetime-local"
										class="input-bordered input w-full"
										bind:value={discountEndDate}
									/>
									<span class="label-text-alt label">Kosongkan jika tanpa batas waktu</span>
								</div>
							{/if}
						</div>
					</div>

					<div class="mb-6 rounded-lg bg-base-200/50 p-6">
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning text-warning-content"
								>
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<div>
									<h3 class="text-lg font-semibold">FAQ Produk</h3>
									<p class="text-sm text-base-content/70">Pertanyaan yang sering ditanyakan</p>
								</div>
							</div>
							<button type="button" class="btn gap-2 btn-outline btn-sm" onclick={addFaqItem}>
								<Plus />
								Tambah FAQ
							</button>
						</div>

						{#if faqItems.length > 0}
							<div class="space-y-3">
								{#each faqItems as item, index}
									<div class="rounded-lg border border-base-300 bg-base-100 p-4">
										<div class="mb-3 flex items-center justify-between">
											<span class="badge badge-sm badge-neutral">FAQ {index + 1}</span>
											<button
												type="button"
												class="btn btn-circle btn-ghost btn-xs"
												onclick={() => removeFaqItem(index)}
											>
												<MessageCircleX strokeWidth={1} />
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
											rows="2"
										></textarea>
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-8 text-center text-base-content/50">
								<div class="mx-auto mb-2 h-12 w-12">
									<MessageCircleQuestionMark strokeWidth={1.5} size="50" />
								</div>
								<p class="text-sm">Belum ada FAQ. Klik tombol Tambah FAQ untuk memulai</p>
							</div>
						{/if}
					</div>

					<div class="flex justify-end gap-3 border-t border-base-300 pt-4">
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
								<Save size={18} />
								Update Produk
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
