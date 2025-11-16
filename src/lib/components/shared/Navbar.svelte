<script lang="ts">
	import { cartCount } from '$lib/stores/cart.store';
	import { authUser } from '$lib/stores/auth.store';
	import { page } from '$app/stores';
	import { CircleUserRound, House, ShoppingBasket } from '@lucide/svelte';

	type Props = {
		showCart?: boolean;
		variant?: 'default' | 'shop' | 'cart';
	};

	let { showCart = true, variant = 'default' }: Props = $props();

	const isActive = (path: string) => $page.url.pathname === path;
	const user = $derived($authUser);
</script>

<nav class="navbar fixed top-0 z-50 bg-base-100 shadow-md">
	<div class="container mx-auto flex items-center justify-between px-4">
		<a href="/" class="flex items-center gap-2 text-xl font-semibold text-primary">
			<span class="text-2xl">🛒</span>
			<span class="hidden sm:inline">AdverFI</span>
		</a>

		<ul class="hidden items-center gap-6 text-sm font-medium lg:flex">
			<li>
				<a
					href="/"
					class="flex items-center gap-1 rounded-md px-3 py-2 transition hover:bg-base-200"
					class:text-primary={isActive('/')}
				>
					<House /> Beranda
				</a>
			</li>
			<li>
				<a
					href="/shop"
					class="flex items-center gap-1 rounded-md px-3 py-2 transition hover:bg-base-200"
					class:text-primary={isActive('/shop')}
				>
					<ShoppingBasket /> Belanja
				</a>
			</li>
		</ul>

		<div class="flex items-center gap-2">
			{#if showCart && user}
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

			{#if user}
				<div class="dropdown dropdown-end">
					<button tabindex="0" class="btn avatar btn-circle btn-ghost">
						<div
							class="flex w-10 items-center justify-center rounded-full bg-primary text-primary-content"
						>
							<span class="text-xl"><CircleUserRound /> </span>
						</div>
					</button>
					<ul
						class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
					>
						<li class="menu-title">
							<span>{user.email}</span>
						</li>
						<li><a href="/my-orders">Pesanan Saya</a></li>
						<li>
							<button
								onclick={async () => {
									await authUser.signOut();
									window.location.href = '/';
								}}
							>
								Logout
							</button>
						</li>
					</ul>
				</div>
			{:else}
				<a href="/login" class="btn hidden items-center btn-outline btn-sm sm:flex"> 👤 Login </a>
			{/if}

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
			{#if user}
				<li>
					<a href="/cart" class:active={isActive('/cart')}>
						🛒 Keranjang
						{#if $cartCount > 0}
							<span class="ml-auto badge badge-primary">{$cartCount}</span>
						{/if}
					</a>
				</li>
				<li><a href="/my-orders">📦 Pesanan Saya</a></li>
				<div class="divider"></div>
				<li>
					<button
						onclick={async () => {
							await authUser.signOut();
							window.location.href = '/';
						}}
					>
						🚪 Logout
					</button>
				</li>
			{:else}
				<div class="divider"></div>
				<li>
					<a href="/login">👤 Login</a>
				</li>
			{/if}
		</ul>
	</div>
</div>

<div class="h-16"></div>
