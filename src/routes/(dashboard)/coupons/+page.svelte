<!-- src/routes/(dashboard)/coupons/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Coupon } from '$lib/types/types';
	import {
		formatCouponDiscount,
		getCouponStatusBadge,
		getCouponStatusText
	} from '$lib/utils/coupon.utils';
	import { formatDate } from '$lib/utils/format.utils';

	let coupons = $state<Coupon[]>([]);
	let loading = $state(true);
	let actionLoading = $state<string | null>(null);

	onMount(async () => {
		await loadCoupons();
	});

	async function loadCoupons() {
		loading = true;
		try {
			const res = await fetch('/api/admin/coupons');
			if (res.ok) {
				const data = await res.json();
				coupons = data;
			}
		} catch (error) {
			console.error('Failed to load coupons:', error);
		} finally {
			loading = false;
		}
	}

	async function toggleActive(couponId: string) {
		actionLoading = couponId;
		try {
			const res = await fetch(`/api/admin/coupons/${couponId}/toggle`, {
				method: 'PUT'
			});

			if (res.ok) {
				await loadCoupons();
			} else {
				alert('Gagal mengubah status');
			}
		} catch (error) {
			console.error('Toggle error:', error);
			alert('Terjadi kesalahan');
		} finally {
			actionLoading = null;
		}
	}

	async function deleteCoupon(couponId: string) {
		if (!confirm('Yakin ingin menghapus kupon ini?')) return;

		actionLoading = couponId;
		try {
			const res = await fetch(`/api/admin/coupons/${couponId}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				await loadCoupons();
			} else {
				alert('Gagal menghapus kupon');
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('Terjadi kesalahan');
		} finally {
			actionLoading = null;
		}
	}
</script>

<div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Kupon Diskon</h1>
			<p class="text-base-content/70">Kelola kupon dan promosi</p>
		</div>
		<a href="/coupons/add-new" class="btn btn-primary">
			<span class="text-xl">➕</span>
			Buat Kupon
		</a>
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if coupons.length}
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama</th>
						<th>Diskon</th>
						<th>Min. Pembelian</th>
						<th>Penggunaan</th>
						<th>Berlaku Sampai</th>
						<th>Status</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each coupons as coupon}
						<tr class="hover">
							<td>
								<span class="badge badge-lg font-mono">{coupon.code}</span>
							</td>
							<td>
								<div class="font-semibold">{coupon.name}</div>
								{#if coupon.description}
									<div class="text-xs text-base-content/70">{coupon.description}</div>
								{/if}
							</td>
							<td class="font-semibold text-primary">
								{formatCouponDiscount(coupon)}
							</td>
							<td class="text-sm">
								{#if coupon.min_purchase > 0}
									Rp{coupon.min_purchase.toLocaleString('id-ID')}
								{:else}
									Tanpa minimum
								{/if}
							</td>
							<td class="text-sm">
								{coupon.usage_count}
								{#if coupon.usage_limit}
									/ {coupon.usage_limit}
								{:else}
									/ ∞
								{/if}
							</td>
							<td class="text-sm">
								{#if coupon.valid_until}
									{formatDate(coupon.valid_until)}
								{:else}
									Tanpa batas
								{/if}
							</td>
							<td>
								<span class="badge {getCouponStatusBadge(coupon)}">
									{getCouponStatusText(coupon)}
								</span>
							</td>
							<td>
								<div class="flex gap-2">
									<button
										class="btn btn-ghost btn-xs"
										onclick={() => toggleActive(coupon.id)}
										disabled={actionLoading === coupon.id}
									>
										{#if actionLoading === coupon.id}
											<span class="loading loading-xs loading-spinner"></span>
										{:else if coupon.is_active}
											Nonaktifkan
										{:else}
											Aktifkan
										{/if}
									</button>
									<a href="/coupons/{coupon.id}" class="btn btn-outline btn-xs"> Edit </a>
									<button
										class="btn btn-xs btn-error"
										onclick={() => deleteCoupon(coupon.id)}
										disabled={actionLoading === coupon.id}
									>
										{#if actionLoading === coupon.id}
											<span class="loading loading-xs loading-spinner"></span>
										{:else}
											Hapus
										{/if}
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Belum ada kupon. Buat kupon pertama Anda!</span>
		</div>
	{/if}
</div>
