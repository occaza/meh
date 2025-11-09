<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSupabaseClient } from '$lib/client/supabase';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		loading = true;
		error = '';

		try {
			const supabase = getSupabaseClient();

			const { data, error: authError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (authError) {
				error = authError.message;
				return;
			}

			if (data.session) {
				// Simpan tokens ke cookies via server endpoint
				const res = await fetch('/api/auth/session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						access_token: data.session.access_token,
						refresh_token: data.session.refresh_token
					})
				});

				if (res.ok) {
					goto('/dashboard');
				} else {
					error = 'Gagal menyimpan session';
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login gagal';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-center text-2xl font-bold">Login Admin</h2>

			{#if error}
				<div class="alert alert-error">
					<span>{error}</span>
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleLogin();
				}}
			>
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
				</div>

				<div class="form-control mt-6">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-sm loading-spinner"></span>
							Loading...
						{:else}
							Login
						{/if}
					</button>
				</div>
			</form>

			<div class="divider">ATAU</div>

			<div class="text-center text-sm">
				<span class="text-base-content/70">Belum punya akun?</span>
				<a href="/register" class="ml-1 link link-primary">Register</a>
			</div>

			<div class="mt-2 text-center text-sm">
				<a href="/" class="link">Kembali ke Beranda</a>
			</div>
		</div>
	</div>
</div>
