<script lang="ts">
	import { onMount } from 'svelte';

	type UserWithRole = {
		id: string;
		email: string;
		role: string;
		full_name?: string;
		phone_number?: string;
		created_at: string;
	};

	let users = $state<UserWithRole[]>([]);
	let loading = $state(true);

	onMount(async () => {
		await loadUsers();
	});

	async function loadUsers() {
		loading = true;
		try {
			const res = await fetch('/api/admin/users');
			if (res.ok) {
				const data = await res.json();
				users = data;
			} else {
				alert('Gagal memuat user');
			}
		} catch (error) {
			console.error('Load users error:', error);
			alert('Terjadi kesalahan');
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Kelola User</h1>
			<p class="text-base-content/70">Daftar user yang terdaftar</p>
		</div>
		<button class="btn btn-ghost" onclick={loadUsers}>
			<span>🔄</span>
			Refresh
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-lg loading-spinner"></span>
		</div>
	{:else if users.length}
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Email</th>
						<th>Nama</th>
						<th>No HP</th>
						<th>Role</th>
						<th>Terdaftar</th>
					</tr>
				</thead>
				<tbody>
					{#each users as user}
						<tr class="hover">
							<td>{user.email}</td>
							<td>{user.full_name || '-'}</td>
							<td>{user.phone_number || '-'}</td>
							<td>
								<span class="badge badge-ghost">User</span>
							</td>
							<td class="text-sm">{formatDate(user.created_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-8 alert alert-info">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-6 w-6 shrink-0 stroke-current"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<div class="text-sm">
				<strong>Info:</strong> Semua user otomatis memiliki role "user". Superadmin hanya bisa ditambah
				manual di database.
			</div>
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Belum ada user terdaftar</span>
		</div>
	{/if}
</div>
