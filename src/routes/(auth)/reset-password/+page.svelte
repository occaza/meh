<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getSupabaseClient } from '$lib/client/supabase';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let hasSession = $state(false);
	let accessToken = $state('');
	let checkingSession = $state(true);

	onMount(async () => {
		const supabase = getSupabaseClient();

		// Tunggu hash fragment dari URL
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Cek apakah ada session dari reset link
		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		console.log('Session check:', {
			hasSession: !!session,
			hasToken: !!session?.access_token,
			error: sessionError
		});

		if (!session || sessionError) {
			// Coba ambil dari URL hash
			const hash = window.location.hash;
			console.log('URL Hash:', hash);

			if (hash) {
				const params = new URLSearchParams(hash.substring(1));
				const token = params.get('access_token');
				const type = params.get('type');

				console.log('Token from hash:', { hasToken: !!token, type });

				if (token && type === 'recovery') {
					accessToken = token;
					hasSession = true;
					checkingSession = false;
					return;
				}
			}

			error = 'Link tidak valid atau sudah kadaluarsa. Silakan request link baru.';
			checkingSession = false;
			return;
		}

		accessToken = session.access_token;
		console.log('Access token set, length:', accessToken.length);
		hasSession = true;
		checkingSession = false;
	});

	async function handleSubmit() {
		loading = true;
		error = '';

		console.log('Submit triggered');

		if (password !== confirmPassword) {
			error = 'Password tidak cocok';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password minimal 6 karakter';
			loading = false;
			return;
		}

		console.log('Sending update request...');

		try {
			const res = await fetch('/api/auth/update-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					password: password,
					access_token: accessToken
				})
			});

			console.log('Response status:', res.status);

			const data = await res.json();
			console.log('Response data:', data);

			if (res.ok) {
				alert('Password berhasil diubah! Silakan login dengan password baru.');
				goto('/login');
			} else {
				error = data.error || 'Gagal mengubah password';
				console.error('Update failed:', error);
			}
		} catch (err) {
			console.error('Submit exception:', err);
			error = 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-center text-2xl font-bold">Reset Password</h2>

			{#if checkingSession}
				<div class="flex flex-col items-center py-8">
					<span class="loading loading-lg loading-spinner"></span>
					<p class="mt-4 text-sm text-base-content/70">Memverifikasi link...</p>
				</div>
			{:else if error && !hasSession}
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
					<div>
						<div class="font-bold">Link Tidak Valid</div>
						<div class="text-sm">{error}</div>
					</div>
				</div>

				<div class="mt-4 text-center">
					<a href="/forgot-password" class="btn btn-primary">Request Link Baru</a>
				</div>
			{:else if hasSession}
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
						<div class="text-sm">{error}</div>
					</div>
				{/if}

				<p class="text-sm text-base-content/70">Masukkan password baru Anda.</p>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<div class="form-control">
						<label class="label" for="password">
							<span class="label-text">Password Baru</span>
						</label>
						<input
							id="password"
							type="password"
							placeholder="••••••••"
							class="input-bordered input"
							autocomplete="new-password"
							bind:value={password}
							required
						/>
						<div class="label">
							<span class="label-text-alt">Minimal 6 karakter</span>
						</div>
					</div>

					<div class="form-control mt-2">
						<label class="label" for="confirmPassword">
							<span class="label-text">Konfirmasi Password</span>
						</label>
						<input
							id="confirmPassword"
							type="password"
							placeholder="••••••••"
							class="input-bordered input"
							autocomplete="new-password"
							bind:value={confirmPassword}
							required
						/>
					</div>

					<div class="form-control mt-6">
						<button type="submit" class="btn btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-sm loading-spinner"></span>
								Menyimpan...
							{:else}
								Ubah Password
							{/if}
						</button>
					</div>
				</form>
			{/if}

			<div class="divider"></div>

			<div class="text-center text-sm">
				<a href="/login" class="link link-primary">Kembali ke Login</a>
			</div>
		</div>
	</div>
</div>
