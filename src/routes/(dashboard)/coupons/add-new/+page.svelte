<!-- src/routes/(dashboard)/coupons/add-new/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';

	let code = $state('');
	let name = $state('');
	let description = $state('');
	let discountType = $state<'percentage' | 'fixed'>('percentage');
	let discountValue = $state(0);
	let minPurchase = $state(0);
	let maxDiscount = $state<number | null>(null);
	let usageLimit = $state<number | null>(null);
	let validFrom = $state('');
	let validUntil = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		loading = true;
		error = '';

		if (!code.trim()) {
			error = 'Kode kupon harus diisi';
			loading = false;
			return;
		}

		if (!name.trim()) {
			error = 'Nama kupon harus diisi';
			loading = false;
			return;
		}

		if (discountValue <= 0) {
			error = 'Nilai diskon harus lebih dari 0';
			loading = false;
			return;
		}

		if (discountType === 'percentage' && discountValue > 100) {
			error = 'Persentase diskon maksimal 100%';
			loading = false;
			return;
		}

		try {
			const res = await fetch('/api/admin/coupons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: code.trim().toUpperCase(),
					name: name.trim(),
					description: description.trim() || null,
					discount_type: discountType,
					discount_value: discountValue,
					min_purchase: minPurchase,
					max_discount: maxDiscount,
					usage_limit: usageLimit,
					valid_from: validFrom || null,
					valid_until: validUntil || null
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Gagal membuat kupon';
				return;
			}

			goto('/coupons');
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'Terjadi kesalahan';
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-3xl">
	<div class="mb-8">
		<a href="/coupons" class="btn btn-ghost btn-sm">
			<span>←</span>
			Kembali
		</a>
	</div>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl">Buat Kupon Baru</h2>

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
				<!-- Basic Info -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label" for="code">
							<span class="label-text">Kode Kupon</span>
						</label>
						<input
							id="code"
							type="text"
							placeholder="PROMO2024"
							class="input-bordered input uppercase"
							bind:value={code}
							required
						/>
						<div class="label">
							<span class="label-text-alt">Huruf kapital, tanpa spasi</span>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text">Nama Kupon</span>
						</label>
						<input
							id="name"
							type="text"
							placeholder="Diskon Akhir Tahun"
							class="input-bordered input"
							bind:value={name}
							required
						/>
					</div>
				</div>

				<div class="form-control mt-4">
					<label class="label" for="description">
						<span class="label-text">Deskripsi</span>
					</label>
					<textarea
						id="description"
						placeholder="Deskripsi kupon (opsional)"
						class="textarea-bordered textarea"
						bind:value={description}
					></textarea>
				</div>

				<div class="divider"></div>

				<!-- Discount Settings -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label" for="discountType">
							<span class="label-text">Tipe Diskon</span>
						</label>
						<select
							id="discountType"
							class="select-bordered select"
							bind:value={discountType}
							required
						>
							<option value="percentage">Persentase (%)</option>
							<option value="fixed">Nominal Tetap (Rp)</option>
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="discountValue">
							<span class="label-text">
								{discountType === 'percentage' ? 'Persentase Diskon' : 'Nominal Diskon'}
							</span>
						</label>
						<input
							id="discountValue"
							type="number"
							placeholder={discountType === 'percentage' ? '10' : '50000'}
							class="input-bordered input"
							bind:value={discountValue}
							min="1"
							max={discountType === 'percentage' ? 100 : undefined}
							required
						/>
					</div>
				</div>

				{#if discountType === 'percentage'}
					<div class="form-control mt-4">
						<label class="label" for="maxDiscount">
							<span class="label-text">Maksimal Diskon (Rp)</span>
						</label>
						<input
							id="maxDiscount"
							type="number"
							placeholder="100000"
							class="input-bordered input"
							bind:value={maxDiscount}
							min="0"
						/>
						<div class="label">
							<span class="label-text-alt">Opsional. Kosongkan jika tanpa batas</span>
						</div>
					</div>
				{/if}

				<div class="divider"></div>

				<!-- Conditions -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label" for="minPurchase">
							<span class="label-text">Minimum Pembelian (Rp)</span>
						</label>
						<input
							id="minPurchase"
							type="number"
							placeholder="0"
							class="input-bordered input"
							bind:value={minPurchase}
							min="0"
						/>
					</div>

					<div class="form-control">
						<label class="label" for="usageLimit">
							<span class="label-text">Batas Penggunaan</span>
						</label>
						<input
							id="usageLimit"
							type="number"
							placeholder="Unlimited"
							class="input-bordered input"
							bind:value={usageLimit}
							min="1"
						/>
						<div class="label">
							<span class="label-text-alt">Kosongkan untuk unlimited</span>
						</div>
					</div>
				</div>

				<div class="divider"></div>

				<!-- Validity Period -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label" for="validFrom">
							<span class="label-text">Berlaku Dari</span>
						</label>
						<input
							id="validFrom"
							type="datetime-local"
							class="input-bordered input"
							bind:value={validFrom}
						/>
						<div class="label">
							<span class="label-text-alt">Kosongkan untuk berlaku sekarang</span>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="validUntil">
							<span class="label-text">Berlaku Sampai</span>
						</label>
						<input
							id="validUntil"
							type="datetime-local"
							class="input-bordered input"
							bind:value={validUntil}
						/>
						<div class="label">
							<span class="label-text-alt">Kosongkan untuk tanpa batas waktu</span>
						</div>
					</div>
				</div>

				<div class="divider"></div>

				<div class="card-actions justify-end">
					<button type="button" class="btn btn-ghost" onclick={() => goto('/coupons')}>
						Batal
					</button>
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-sm loading-spinner"></span>
							Menyimpan...
						{:else}
							<span>💾</span>
							Simpan Kupon
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
