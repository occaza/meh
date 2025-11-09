<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
	import { cartCount } from '$lib/stores/cart.store';
	import { page } from '$app/stores';

	type Props = {
		showCart?: boolean;
		variant?: 'default' | 'shop' | 'cart';
	};

	let { showCart = true, variant = 'default' }: Props = $props();

	const isActive = (path: string) => $page.url.pathname === path;
</script>

<nav class="navbar fixed top-0 z-50 bg-base-100 shadow-md">
	<div class="container mx-auto flex items-center justify-between px-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 text-xl font-semibold text-primary">
			<span class="text-2xl">🛒</span>
			<span class="hidden sm:inline">Toko Digital</span>
		</a>

		<!-- Desktop Menu -->
		<ul class="hidden items-center gap-6 text-sm font-medium lg:flex">
			<li>
				<a
					href="/"
					class="flex items-center gap-1 rounded-md px-3 py-2 transition hover:bg-base-200"
					class:text-primary={isActive('/')}
				>
					🏠 Beranda
				</a>
			</li>
			<li>
				<a
					href="/shop"
					class="flex items-center gap-1 rounded-md px-3 py-2 transition hover:bg-base-200"
					class:text-primary={isActive('/shop')}
				>
					🛍️ Belanja
				</a>
			</li>
		</ul>

		<!-- Right Actions -->
		<div class="flex items-center gap-2">
			<!-- Cart -->
			{#if showCart}
				<a href="/cart" class="btn relative btn-circle btn-ghost">
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
							d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					{#if $cartCount > 0}
						<span class="absolute top-0 right-0 badge badge-sm badge-primary">{$cartCount}</span>
					{/if}
				</a>
			{/if}

			<!-- Admin -->
			<a href="/login" class="btn hidden items-center btn-outline btn-sm sm:flex"> 👤 Admin </a>

			<!-- Mobile Menu Button -->
			<label for="mobile-menu" class="btn btn-square btn-ghost lg:hidden">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="inline-block h-6 w-6 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</label>
		</div>
	</div>
</nav>

<!-- Mobile Drawer -->
<input id="mobile-menu" type="checkbox" class="drawer-toggle" />
<div class="drawer z-40 drawer-end">
	<div class="drawer-side">
		<label for="mobile-menu" class="drawer-overlay"></label>
		<ul class="menu min-h-full w-72 bg-base-200 p-6 text-base-content">
			<li class="mb-4 text-lg font-semibold">Menu</li>
			<li>
				<a href="/" class:active={isActive('/')}>🏠 Beranda</a>
			</li>
			<li>
				<a href="/shop" class:active={isActive('/shop')}>🛍️ Belanja</a>
			</li>
			<li>
				<a href="/cart" class:active={isActive('/cart')}>
					🛒 Keranjang
					{#if $cartCount > 0}
						<span class="ml-auto badge badge-primary">{$cartCount}</span>
					{/if}
				</a>
			</li>
			<div class="divider"></div>
			<li>
				<a href="/login">👤 Admin</a>
			</li>
		</ul>
	</div>
</div>

<!-- Spacer -->
<div class="h-16"></div>
