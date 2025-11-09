<script lang="ts">
	import { goto } from '$app/navigation';
	import { uploadProductImage } from '$lib/utils/upload.utils';

	let name = $state('');
	let description = $state('');
	let detailDescription = $state('');
	let price = $state(0);
	let stock = $state(0);
	let discountPercentage = $state(0);
	let discountEndDate = $state('');
	let imageFiles = $state<FileList | null>(null);
	let imagePreviewUrls = $state<string[]>([]);
	let loading = $state(false);
	let uploadingImages = $state(false);
	let error = $state('');

	function handleImageChange(e: Event) {
		const target = e.target as HTMLInputElement;
		imageFiles = target.files;

		if (imageFiles) {
			imagePreviewUrls = [];
			Array.from(imageFiles).forEach((file) => {
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

	async function handleSubmit() {
		loading = true;
		error = '';

		// Validasi
		if (!name.trim()) {
			error = 'Nama produk harus diisi';
			loading = false;
			return;
		}

		if (!description.trim()) {
			error = 'Deskripsi harus diisi';
			loading = false;
			return;
		}

		if (price <= 0) {
			error = 'Harga harus lebih dari 0';
			loading = false;
			return;
		}

		if (stock < 0) {
			error = 'Stok tidak boleh negatif';
			loading = false;
			return;
		}

		if (discountPercentage < 0 || discountPercentage > 100) {
			error = 'Diskon harus antara 0-100%';
			loading = false;
			return;
		}

		try {
			// Upload images
			let uploadedImageUrls: string[] = [];

			if (imageFiles && imageFiles.length > 0) {
				uploadingImages = true;
				const uploadPromises = Array.from(imageFiles).map((file) => uploadProductImage(file));
				const results = await Promise.all(uploadPromises);
				uploadedImageUrls = results.filter((url) => url !== null) as string[];
				uploadingImages = false;

				if (uploadedImageUrls.length === 0) {
					error = 'Gagal mengupload gambar';
					loading = false;
					return;
				}
			}

			// Create product
			const res = await fetch('/api/admin/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					description,
					detail_description: detailDescription || description,
					price,
					stock,
					discount_percentage: discountPercentage,
					discount_end_date: discountEndDate || null,
					images: uploadedImageUrls
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Gagal menambahkan produk';
				return;
			}

			goto('/products');
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'Terjadi kesalahan';
		} finally {
			loading = false;
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

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl">Tambah Produk Baru</h2>

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
				<!-- Product Images -->
				<div class="form-control">
					<label class="label" for="images">
						<span class="label-text">Gambar Produk (Max 3)</span>
					</label>
					<input
						id="images"
						type="file"
						accept="image/*"
						multiple
						class="file-input-bordered file-input w-full"
						onchange={handleImageChange}
						disabled={loading}
					/>
					<div class="label">
						<span class="label-text-alt">Format: JPG, PNG. Max 3 gambar.</span>
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

				<!-- Basic Info -->
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
					<div class="label">
						<span class="label-text-alt"
							>Opsional. Jika kosong, akan menggunakan deskripsi singkat.</span
						>
					</div>
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
					<button type="submit" class="btn btn-primary" disabled={loading || uploadingImages}>
						{#if uploadingImages}
							<span class="loading loading-sm loading-spinner"></span>
							Upload Gambar...
						{:else if loading}
							<span class="loading loading-sm loading-spinner"></span>
							Menyimpan...
						{:else}
							<span>💾</span>
							Simpan Produk
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
