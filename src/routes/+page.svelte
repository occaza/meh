<script lang="ts">
	import { cartCount } from '$lib/stores/cart.store';
	const features = [
		{
			icon: '⚡',
			title: 'Pembayaran Cepat',
			description: 'Proses checkout dalam hitungan detik dengan berbagai metode pembayaran'
		},
		{
			icon: '🔒',
			title: 'Aman & Terpercaya',
			description: 'Keamanan data dan transaksi Anda terjamin dengan enkripsi tingkat tinggi'
		},
		{
			icon: '📱',
			title: 'Multi Platform',
			description: 'Akses dari mana saja, kapan saja melalui desktop atau mobile'
		}
	];
</script>

<div class="min-h-screen">
	<!-- Navbar -->
	<div class="navbar fixed top-0 z-50 bg-base-100/80 shadow-lg backdrop-blur-sm">
		<div class="container mx-auto">
			<div class="flex-1">
				<a href="/" class="btn text-xl btn-ghost">
					<span class="text-2xl">🛒</span>
					Toko Digital
				</a>
			</div>
			<div class="flex-none gap-2">
				<a href="/shop" class="btn btn-ghost">Belanja</a>
				<a href="/cart" class="btn btn-circle btn-ghost">
					<div class="indicator">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						{#if $cartCount > 0}
							<span class="indicator-item badge badge-sm badge-primary">{$cartCount}</span>
						{/if}
					</div>
				</a>
				<a href="/login" class="btn btn-ghost">Admin</a>
			</div>
		</div>
	</div>
	<!-- Hero Section -->
	<div class="hero min-h-[80vh] bg-linear-to-br from-primary to-secondary">
		<div class="hero-content text-center text-primary-content">
			<div class="max-w-3xl">
				<h1 class="mb-5 text-5xl font-bold md:text-6xl lg:text-7xl">
					Belanja Digital<br />Lebih Mudah & Cepat
				</h1>
				<p class="mb-8 text-lg md:text-xl">
					Platform terpercaya untuk membeli produk digital dengan proses pembayaran yang simpel dan
					aman
				</p>
				<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
					<a href="/shop" class="btn btn-lg btn-neutral">
						<span class="text-xl">🛒</span>
						Mulai Belanja
					</a>
					<a href="#features" class="btn btn-ghost btn-outline btn-lg"> Pelajari Lebih Lanjut </a>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div id="features" class="bg-base-200 py-20">
		<div class="container mx-auto px-4">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-4xl font-bold">Kenapa Pilih Kami?</h2>
				<p class="text-lg text-base-content/70">
					Pengalaman berbelanja yang lebih baik dengan fitur unggulan
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
				{#each features as feature}
					<div class="card bg-base-100 shadow-xl transition-transform hover:scale-105">
						<div class="card-body items-center text-center">
							<div class="mb-4 text-6xl">{feature.icon}</div>
							<h3 class="card-title text-2xl">{feature.title}</h3>
							<p class="text-base-content/70">{feature.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="bg-primary py-20 text-primary-content">
		<div class="container mx-auto px-4 text-center">
			<h2 class="mb-4 text-4xl font-bold">Siap Untuk Memulai?</h2>
			<p class="mb-8 text-lg">
				Jelajahi koleksi produk digital kami dan nikmati kemudahan berbelanja
			</p>
			<a href="/shop" class="btn btn-lg btn-neutral">
				<span class="text-xl">🛍️</span>
				Lihat Semua Produk
			</a>
		</div>
	</div>

	<!-- Footer -->
	<footer class="footer-center footer bg-base-300 p-10 text-base-content">
		<div>
			<p class="text-lg font-bold">adverFI</p>
			<p>Platform belanja digital terpercaya sejak 2025</p>
		</div>
		<div>
			<div class="grid grid-flow-col gap-4">
				<a href="/shop" class="link link-hover">Produk</a>
				<a href="/login" class="link link-hover">Admin</a>
			</div>
		</div>
		<div>
			<p>© 2025 - All rights reserved</p>
		</div>
	</footer>
</div>
