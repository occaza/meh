<!-- src/routes/(dashboard)/users/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';

	type UserWithRole = {
		id: string;
		email: string;
		role: string;
		created_at: string;
	};

	let users = $state<UserWithRole[]>([]);
	let loading = $state(true);
	let updating = $state<string | null>(null);

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

	async function updateRole(userId: string, newRole: string) {
		if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return;

		updating = userId;
		try {
			const res = await fetch(`/api/admin/users/${userId}/role`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: newRole })
			});

			if (res.ok) {
				await loadUsers();
				alert('Role berhasil diubah');
			} else {
				const data = await res.json();
				alert(data.error || 'Gagal mengubah role');
			}
		} catch (error) {
			console.error('Update role error:', error);
			alert('Terjadi kesalahan');
		} finally {
			updating = null;
		}
	}

	function getRoleBadgeClass(role: string) {
		switch (role) {
			case 'superadmin':
				return 'badge-error';
			case 'admin':
				return 'badge-warning';
			default:
				return 'badge-ghost';
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
			<p class="text-base-content/70">Manage user roles and permissions</p>
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
						<th>Role</th>
						<th>Terdaftar</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each users as user}
						<tr class="hover">
							<td>{user.email}</td>
							<td>
								<span class="badge {getRoleBadgeClass(user.role)}">
									{user.role}
								</span>
							</td>
							<td class="text-sm">{formatDate(user.created_at)}</td>
							<td>
								<div class="flex gap-2">
									{#if user.role !== 'superadmin'}
										<button
											class="btn btn-xs btn-warning"
											onclick={() => updateRole(user.id, 'admin')}
											disabled={updating === user.id || user.role === 'admin'}
										>
											{#if updating === user.id}
												<span class="loading loading-xs loading-spinner"></span>
											{:else}
												Make Admin
											{/if}
										</button>
									{/if}

									{#if user.role !== 'user'}
										<button
											class="btn btn-ghost btn-xs"
											onclick={() => updateRole(user.id, 'user')}
											disabled={updating === user.id || user.role === 'user'}
										>
											{#if updating === user.id}
												<span class="loading loading-xs loading-spinner"></span>
											{:else}
												Make User
											{/if}
										</button>
									{/if}
								</div>
							</td>
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
				<strong>Info:</strong> Hanya superadmin yang bisa mengubah role user. Admin dan user hanya bisa
				akses fitur sesuai permission mereka.
			</div>
		</div>
	{:else}
		<div class="alert alert-info">
			<span>Belum ada user terdaftar</span>
		</div>
	{/if}
</div>
