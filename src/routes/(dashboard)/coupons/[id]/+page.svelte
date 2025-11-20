<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Coupon } from '$lib/types/types';
	import { ArrowLeft, Save } from '@lucide/svelte';

	const couponId = $derived($page.params.id);

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
	let isActive = $state(true);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	onMount(async () => {
		await loadCoupon();
	});

	async function loadCoupon() {
		try {
			const res = await fetch(`/api/admin/coupons/${couponId}`);

			if (!res.ok) {
				error = 'Kupon tidak ditemukan';
				return;
			}

			const data: Coupon = await res.json();

			code = data.code;
			name = data.name;
			description = data.description || '';
			discountType = data.discount_type;
			discountValue = data.discount_value;
			minPurchase = data.min_purchase;
			maxDiscount = data.max_discount ?? null;
			usageLimit = data.usage_limit ?? null;
			isActive = data.is_active;

			if (data.valid_from) {
				const fromDate = new Date(data.valid_from);
				validFrom = fromDate.toISOString().slice(0, 16);
			}

			if (data.valid_until) {
				const untilDate = new Date(data.valid_until);
				validUntil = untilDate.toISOString().slice(0, 16);
			}
		} catch (err) {
			console.error('Load coupon error:', err);
			error = 'Gagal memuat data kupon';
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		saving = true;
		error = '';

		if (!name.trim()) {
			error = 'Nama kupon harus diisi';
			saving = false;
			return;
		}

		if (discountValue <= 0) {
			error = 'Nilai diskon harus lebih dari 0';
			saving = false;
			return;
		}

		if (discountType === 'percentage' && discountValue > 100) {
			error = 'Persentase diskon maksimal 100%';
			saving = false;
			return;
		}

		try {
			const res = await fetch(`/api/admin/coupons/${couponId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					description: description.trim() || null,
					discount_type: discountType,
					discount_value: discountValue,
					min_purchase: minPurchase,
					max_discount: maxDiscount,
					usage_limit: usageLimit,
					valid_from: validFrom || null,
					valid_until: validUntil || null,
					is_active: isActive
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Gagal mengupdate kupon';
				return;
			}

			goto('/coupons');
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'Terjadi kesalahan';
		} finally {
			saving = false;
		}
	}
</script>

<div>
	<div class="mb-8">
		<a href="/coupons" class="btn gap-2 btn-ghost btn-sm">
			<ArrowLeft size={18} />
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
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-2xl">Edit Kupon</h2>
				<p class="text-base-content/70">Perbarui informasi kupon</p>

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
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="form-control flex flex-col">
							<label class="label" for="name">
								<span class="label-text">Nama Kupon</span>
							</label>
							<input
								id="name"
								type="text"
								placeholder="Diskon Akhir Tahun"
								class="input-bordered input w-full"
								bind:value={name}
								required
							/>
						</div>
						<div class="form-control flex flex-col">
							<label class="label" for="code">
								<span class="label-text">Kode Kupon</span>
							</label>
							<input
								id="code"
								type="text"
								class="input-bordered input w-full"
								value={code}
								disabled
							/>
							<div class="label">
								<span class="label-text-alt">Kode tidak bisa diubah</span>
							</div>
						</div>
					</div>

					<div class="form-control flex flex-col">
						<label class="label" for="description">
							<span class="label-text">Deskripsi</span>
						</label>
						<textarea
							id="description"
							placeholder="Deskripsi kupon"
							class="textarea-bordered textarea w-full resize-none"
							bind:value={description}
						></textarea>
					</div>

					<div class="divider"></div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="form-control flex flex-col">
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

						<div class="form-control flex flex-col">
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

						{#if discountType === 'percentage'}
							<div class="form-control flex flex-col">
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
									<span class="label-text-alt">Kosongkan jika tanpa batas</span>
								</div>
							</div>
						{/if}
					</div>

					<div class="divider"></div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="form-control flex flex-col">
							<label class="label" for="minPurchase">
								<span class="label-text">Minimum Pembelian (Rp)</span>
							</label>
							<input
								id="minPurchase"
								type="number"
								placeholder="0"
								class="input-bordered input w-full"
								bind:value={minPurchase}
								min="0"
							/>
						</div>

						<div class="form-control flex flex-col">
							<label class="label" for="usageLimit">
								<span class="label-text">Batas Penggunaan</span>
							</label>
							<input
								id="usageLimit"
								type="number"
								placeholder="Unlimited"
								class="input-bordered input w-full"
								bind:value={usageLimit}
								min="1"
							/>
							<div class="label">
								<span class="label-text-alt">Kosongkan untuk unlimited</span>
							</div>
						</div>
						<div class="form-control flex flex-col">
							<label class="label" for="validFrom">
								<span class="label-text">Berlaku Dari</span>
							</label>
							<input
								id="validFrom"
								type="datetime-local"
								class="input-bordered input w-full"
								bind:value={validFrom}
							/>
						</div>

						<div class="form-control flex flex-col">
							<label class="label" for="validUntil">
								<span class="label-text">Berlaku Sampai</span>
							</label>
							<input
								id="validUntil"
								type="datetime-local"
								class="input-bordered input w-full"
								bind:value={validUntil}
							/>
						</div>
					</div>

					<div class="divider"></div>

					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-4">
							<input type="checkbox" class="toggle toggle-success" bind:checked={isActive} />
							<span class="label-text">Kupon Aktif</span>
						</label>
					</div>
					<div class="divider"></div>

					<div class="card-actions justify-end">
						<button type="button" class="btn btn-ghost" onclick={() => goto('/coupons')}>
							Batal
						</button>
						<button type="submit" class="btn gap-2 btn-primary" disabled={saving}>
							{#if saving}
								<span class="loading loading-sm loading-spinner"></span>
								Menyimpan
							{:else}
								<Save size={18} />
								Update Kupon
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
