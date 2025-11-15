<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSupabaseClient } from '$lib/client/supabase';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let fullName = $state('');
	let phoneNumber = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);
	let successMessage = $state('');

	async function handleRegister() {
		loading = true;
		error = '';

		if (!fullName.trim()) {
			error = 'Nama lengkap harus diisi';
			loading = false;
			return;
		}

		if (!phoneNumber.trim()) {
			error = 'Nomor HP harus diisi';
			loading = false;
			return;
		}

		if (!/^[0-9+\-\s()]+$/.test(phoneNumber)) {
			error = 'Nomor HP tidak valid';
			loading = false;
			return;
		}

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

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					full_name: fullName.trim(),
					phone_number: phoneNumber.trim()
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Registrasi gagal';
				return;
			}

			success = true;
			successMessage = data.message;

			// Redirect setelah 5 detik
			setTimeout(() => {
				goto('/login');
			}, 5000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registrasi gagal';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-center text-2xl font-bold">Register</h2>

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
					<div>
						<div class="font-bold">Registrasi Berhasil!</div>
						<div class="text-sm">{successMessage}</div>
						<div class="mt-2 text-xs text-success-content/70">
							Redirect ke login dalam 5 detik...
						</div>
					</div>
				</div>

				<div class="mt-4 text-center">
					<p class="text-sm text-base-content/70">Tidak menerima email?</p>
					<p class="text-xs text-base-content/50">Cek folder spam/junk Anda</p>
				</div>
			{:else}
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
						handleRegister();
					}}
				>
					<div class="form-control">
						<label class="label" for="fullName">
							<span class="label-text">Nama Lengkap</span>
						</label>
						<input
							id="fullName"
							type="text"
							placeholder="John Doe"
							class="input-bordered input"
							bind:value={fullName}
							autocomplete="name"
							required
						/>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="phoneNumber">
							<span class="label-text">Nomor HP</span>
						</label>
						<input
							id="phoneNumber"
							type="tel"
							placeholder="08123456789"
							class="input-bordered input"
							autocomplete="tel"
							bind:value={phoneNumber}
							required
						/>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="email">
							<span class="label-text">Email</span>
						</label>
						<input
							id="email"
							type="email"
							placeholder="john@example.com"
							class="input-bordered input"
							autocomplete="email"
							bind:value={email}
							required
						/>
					</div>

					<div class="form-control mt-4">
						<label class="label" for="password">
							<span class="label-text">Password</span>
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
								Loading...
							{:else}
								Register
							{/if}
						</button>
					</div>
				</form>

				<div class="divider">ATAU</div>

				<div class="text-center text-sm">
					<span class="text-base-content/70">Sudah punya akun?</span>
					<a href="/login" class="ml-1 link link-primary">Login</a>
				</div>
			{/if}

			<div class="mt-2 text-center text-sm">
				<a href="/" class="link">Kembali ke Beranda</a>
			</div>
		</div>
	</div>
</div>
