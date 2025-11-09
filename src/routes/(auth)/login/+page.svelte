<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSupabaseClient } from '$lib/client/supabase';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	onMount(async () => {
		const supabase = getSupabaseClient();
		const {
			data: { session }
		} = await supabase.auth.getSession();

		// Jika sesi sudah ada, redirect langsung
		if (session) {
			await goto('/dashboard');
		}
	});

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
					// Redirect ke dashboard setelah session tersimpan
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
