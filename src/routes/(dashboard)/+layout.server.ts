// src/routes/(dashboard)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import { getUser, isSuperAdmin } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const user = await getUser(cookies);

	if (!user) {
		throw redirect(302, '/login');
	}

	// Hanya superadmin yang bisa akses dashboard
	if (!isSuperAdmin(user)) {
		throw redirect(302, '/');
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			role: user.role
		}
	};
};
