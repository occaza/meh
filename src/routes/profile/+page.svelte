<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Navbar } from '$lib';
	import { authUser } from '$lib/stores/auth.store';
	import { uploadAvatar, deleteAvatar } from '$lib/utils/avatar.utils';

	let { data } = $props(); // Tambah ini

	// Ganti ini
	const user = $derived(data.user);

	let profile = $state({
		email: '',
		full_name: '',
		phone_number: '',
		avatar_url: '',
		bio: ''
	});

	let loading = $state(true);
	let saving = $state(false);
	let uploadingAvatar = $state(false);
	let error = $state('');
	let success = $state('');

	let showEmailModal = $state(false);
	let showPasswordModal = $state(false);

	let newEmail = $state('');
	let emailLoading = $state(false);

	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordLoading = $state(false);

	onMount(async () => {
		// Hapus check user di sini karena sudah di server
		await loadProfile();
	});

	async function loadProfile() {
		try {
			const res = await fetch('/api/profile');
			if (res.ok) {
				profile = await res.json();
			}
		} catch (err) {
			console.error('Load profile error:', err);
		} finally {
			loading = false;
		}
	}

	async function handleAvatarUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || !input.files[0] || !user) return;

		const file = input.files[0];
		uploadingAvatar = true;
		error = '';

		const result = await uploadAvatar(file, user.id);

		if (result.success && result.url) {
			profile.avatar_url = result.url;
			await saveProfile();
		} else {
			error = result.error || 'Upload gagal';
		}

		uploadingAvatar = false;
	}

	async function handleRemoveAvatar() {
		if (!confirm('Hapus foto profile?')) return;
		if (!user) return;

		uploadingAvatar = true;
		await deleteAvatar(user.id);
		profile.avatar_url = '';
		await saveProfile();
		uploadingAvatar = false;
	}

	async function saveProfile() {
		saving = true;
		error = '';
		success = '';

		try {
			const res = await fetch('/api/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile)
			});

			if (res.ok) {
				success = 'Profile berhasil diupdate';
				setTimeout(() => (success = ''), 3000);
			} else {
				const data = await res.json();
				error = data.error || 'Gagal update profile';
			}
		} catch (err) {
			error = 'Terjadi kesalahan';
		} finally {
			saving = false;
		}
	}

	async function handleUpdateEmail() {
		if (!newEmail.trim()) {
			error = 'Email baru harus diisi';
			return;
		}

		emailLoading = true;
		error = '';

		try {
			const res = await fetch('/api/profile/update-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ new_email: newEmail })
			});

			const data = await res.json();

			if (res.ok) {
				alert(data.message);
				showEmailModal = false;
				newEmail = '';
			} else {
				error = data.error || 'Gagal update email';
			}
		} catch (err) {
			error = 'Terjadi kesalahan';
		} finally {
			emailLoading = false;
		}
	}

	async function handleUpdatePassword() {
		if (!newPassword.trim()) {
			error = 'Password baru harus diisi';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Password tidak cocok';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password minimal 6 karakter';
			return;
		}

		passwordLoading = true;
		error = '';

		try {
			const res = await fetch('/api/profile/update-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ new_password: newPassword })
			});

			const data = await res.json();

			if (res.ok) {
				alert(data.message);
				showPasswordModal = false;
				newPassword = '';
				confirmPassword = '';
			} else {
				error = data.error || 'Gagal update password';
			}
		} catch (err) {
			error = 'Terjadi kesalahan';
		} finally {
			passwordLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-base-200">
	<Navbar />

	<div class="container mx-auto px-4 py-8">
		<div class="mx-auto max-w-2xl">
			<h1 class="mb-6 text-3xl font-bold">Edit Profile</h1>

			{#if loading}
				<div class="flex justify-center py-20">
					<span class="loading loading-lg loading-spinner"></span>
				</div>
			{:else}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
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

						{#if success}
							<div class="alert alert-success">
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
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>{success}</span>
							</div>
						{/if}

						<div class="flex flex-col items-center">
							<div class="avatar">
								<div class="w-32 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
									{#if profile.avatar_url}
										<img src={profile.avatar_url} alt="Avatar" />
									{:else}
										<div
											class="flex h-full items-center justify-center bg-primary text-6xl text-primary-content"
										>
											{profile.full_name?.charAt(0) || '👤'}
										</div>
									{/if}
								</div>
							</div>

							<div class="mt-4 flex gap-2">
								<label class="btn btn-outline btn-sm" class:loading={uploadingAvatar}>
									{uploadingAvatar ? 'Uploading...' : 'Upload Foto'}
									<input
										type="file"
										class="hidden"
										accept="image/*"
										onchange={handleAvatarUpload}
										disabled={uploadingAvatar}
									/>
								</label>

								{#if profile.avatar_url}
									<button
										class="btn btn-outline btn-sm btn-error"
										onclick={handleRemoveAvatar}
										disabled={uploadingAvatar}
									>
										Hapus Foto
									</button>
								{/if}
							</div>
						</div>

						<div class="divider"></div>

						<form
							onsubmit={(e) => {
								e.preventDefault();
								saveProfile();
							}}
						>
							<div class="form-control">
								<label class="label" for="full_name">
									<span class="label-text">Nama Lengkap</span>
								</label>
								<input
									id="full_name"
									type="text"
									class="input-bordered input"
									bind:value={profile.full_name}
								/>
							</div>

							<div class="form-control mt-4">
								<label class="label" for="phone_number">
									<span class="label-text">Nomor HP</span>
								</label>
								<input
									id="phone_number"
									type="tel"
									class="input-bordered input"
									bind:value={profile.phone_number}
								/>
							</div>

							<div class="form-control mt-4">
								<label class="label" for="bio">
									<span class="label-text">Bio</span>
								</label>
								<textarea
									id="bio"
									class="textarea-bordered textarea h-24"
									placeholder="Ceritakan tentang diri Anda..."
									bind:value={profile.bio}
								></textarea>
							</div>

							<div class="divider"></div>

							<div class="rounded-lg bg-base-200 p-4">
								<div class="mb-2 text-sm font-semibold">Keamanan Akun</div>

								<div class="flex items-center justify-between py-2">
									<div>
										<div class="font-medium">Email</div>
										<div class="text-sm text-base-content/70">{profile.email}</div>
									</div>
									<button
										type="button"
										class="btn btn-outline btn-sm"
										onclick={() => (showEmailModal = true)}
									>
										Ubah
									</button>
								</div>

								<div class="divider my-2"></div>

								<div class="flex items-center justify-between py-2">
									<div>
										<div class="font-medium">Password</div>
										<div class="text-sm text-base-content/70">••••••••</div>
									</div>
									<button
										type="button"
										class="btn btn-outline btn-sm"
										onclick={() => (showPasswordModal = true)}
									>
										Ubah
									</button>
								</div>
							</div>

							<div class="divider"></div>

							<button type="submit" class="btn btn-block btn-primary" disabled={saving}>
								{#if saving}
									<span class="loading loading-sm loading-spinner"></span>
									Menyimpan...
								{:else}
									Simpan Perubahan
								{/if}
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showEmailModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Ubah Email</h3>

			{#if error}
				<div class="mb-4 alert alert-error">
					<span class="text-sm">{error}</span>
				</div>
			{/if}

			<div class="form-control">
				<label class="label" for="new_email">
					<span class="label-text">Email Baru</span>
				</label>
				<input
					id="new_email"
					type="email"
					class="input-bordered input"
					placeholder="email@example.com"
					bind:value={newEmail}
				/>
			</div>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showEmailModal = false;
						newEmail = '';
						error = '';
					}}
				>
					Batal
				</button>
				<button class="btn btn-primary" onclick={handleUpdateEmail} disabled={emailLoading}>
					{#if emailLoading}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						Ubah Email
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showPasswordModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Ubah Password</h3>

			{#if error}
				<div class="mb-4 alert alert-error">
					<span class="text-sm">{error}</span>
				</div>
			{/if}

			<div class="form-control">
				<label class="label" for="new_password">
					<span class="label-text">Password Baru</span>
				</label>
				<input
					id="new_password"
					type="password"
					class="input-bordered input"
					placeholder="••••••••"
					bind:value={newPassword}
				/>
			</div>

			<div class="form-control mt-4">
				<label class="label" for="confirm_password">
					<span class="label-text">Konfirmasi Password</span>
				</label>
				<input
					id="confirm_password"
					type="password"
					class="input-bordered input"
					placeholder="••••••••"
					bind:value={confirmPassword}
				/>
			</div>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showPasswordModal = false;
						newPassword = '';
						confirmPassword = '';
						error = '';
					}}
				>
					Batal
				</button>
				<button class="btn btn-primary" onclick={handleUpdatePassword} disabled={passwordLoading}>
					{#if passwordLoading}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						Ubah Password
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
