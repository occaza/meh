<script lang="ts">
	let email = $state('');
	let loading = $state(false);
	let success = $state(false);
	let error = $state('');

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/auth/request-reset', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await res.json();

			if (res.ok) {
				success = true;
			} else {
				error = data.error || 'Gagal mengirim email reset';
			}
		} catch (err) {
			error = 'Terjadi kesalahan. Silakan coba lagi';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-center text-2xl font-bold">Lupa Password</h2>

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
						<div class="font-bold">Email Terkirim!</div>
						<div class="text-sm">Cek email Anda untuk link reset password.</div>
					</div>
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

				<p class="text-sm text-base-content/70">
					Masukkan email Anda. Link reset password akan dikirim ke email tersebut.
				</p>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text">Email</span>
						</label>
						<input
							id="email"
							type="email"
							placeholder="nama@example.com"
							class="input-bordered input"
							autocomplete="email"
							bind:value={email}
							required
						/>
					</div>

					<div class="form-control mt-6">
						<button type="submit" class="btn btn-primary" disabled={loading}>
							{#if loading}
								<span class="loading loading-sm loading-spinner"></span>
								Mengirim...
							{:else}
								Kirim Link Reset
							{/if}
						</button>
					</div>
				</form>
			{/if}

			<div class="divider"></div>

			<div class="text-center text-sm">
				<span class="text-base-content/70">Ingat password?</span>
				<a href="/login" class="ml-1 link link-primary">Login</a>
			</div>

			<div class="mt-2 text-center text-sm">
				<a href="/" class="link">Kembali ke Beranda</a>
			</div>
		</div>
	</div>
</div>
