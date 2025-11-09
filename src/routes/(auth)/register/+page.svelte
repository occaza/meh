<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSupabaseClient } from '$lib/client/supabase';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;

	async function handleRegister() {
		loading = true;
		error = '';

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
			const supabase = getSupabaseClient();

			const { data, error: authError } = await supabase.auth.signUp({
				email,
				password
			});

			if (authError) {
				error = authError.message;
				return;
			}

			if (data.user) {
				success = true;
				setTimeout(() => {
					goto('/login');
				}, 2000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registrasi gagal';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-center text-2xl font-bold">Register Admin</h2>

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
					<span>Registrasi berhasil! Cek email untuk verifikasi. Redirect ke login...</span>
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

				<form on:submit|preventDefault={handleRegister}>
					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text">Email</span>
						</label>
						<input
							id="email"
							type="email"
							placeholder="admin@example.com"
							class="input-bordered input"
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
