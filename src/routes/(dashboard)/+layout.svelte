<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getSupabaseClient } from '$lib/client/supabase';
	import {
		LayoutDashboard,
		Package,
		Ticket,
		CreditCard,
		Users,
		PackagePlus,
		House,
		DoorOpen
	} from '@lucide/svelte';

	let { data, children } = $props();
	// let processingCount = $state(0);

	const user = $derived(data.user);
	const isSuperAdmin = $derived(user.role === 'superadmin');

	const menuItems = [
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/products', icon: Package, label: 'Produk' },
		{ href: '/coupons', icon: Ticket, label: 'Kupon' },
		{ href: '/transaction', icon: CreditCard, label: 'Transaksi' },
		{ href: '/users', icon: Users, label: 'Kelola User' },
		{ href: '/orders-processing', icon: PackagePlus, label: 'Pesanan Baru' }
	];

	async function handleLogout() {
		const supabase = getSupabaseClient();
		await supabase.auth.signOut();
		await fetch('/api/auth/session', { method: 'DELETE' });
		goto('/login');
	}
</script>

<div class="drawer lg:drawer-open">
	<input id="drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content flex flex-col">
		<div class="navbar bg-base-300 lg:hidden">
			<div class="flex-none">
				<label for="drawer" class="btn btn-square btn-ghost">
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
						></path>
					</svg>
				</label>
			</div>
			<div class="flex-1">
				<span class="text-xl font-bold">Admin Toko</span>
			</div>
		</div>

		<div class="p-4 lg:p-8">
			{@render children()}
		</div>
	</div>

	<div class="drawer-side">
		<label for="drawer" class="drawer-overlay"></label>
		<div class="menu min-h-full w-80 bg-base-200 p-4 text-base-content">
			<div class="mb-8 px-4 py-6">
				<h2 class="text-2xl font-bold">Admin Toko</h2>

				<div class="mt-4 rounded-lg bg-base-300 p-3">
					<div class="mb-1 text-sm text-base-content/70">Logged in as:</div>
					<div class="font-semibold">{user.email}</div>
					<div class="mt-2">
						<span class="badge badge-error">Super Admin</span>
					</div>
				</div>
			</div>

			<ul class="space-y-2">
				{#each menuItems as item}
					<li>
						<a
							href={item.href}
							class="flex items-center gap-3"
							class:active={$page.url.pathname === item.href}
						>
							<span class="text-xl"><item.icon size="20" /> </span>
							<span>{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>

			<div class="mt-auto">
				<div class="divider"></div>
				<ul>
					<li>
						<a href="/" class="flex items-center gap-3">
							<span class="text-xl"><House /></span>
							<span>Ke Halaman Utama</span>
						</a>
					</li>
					<li>
						<button onclick={handleLogout} class="flex items-center gap-3">
							<span class="text-xl"><DoorOpen /></span>
							<span>Logout</span>
						</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
