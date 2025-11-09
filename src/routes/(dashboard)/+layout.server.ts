// src/routes/(dashboard)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import { getUser, isAdmin } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const user = await getUser(cookies);

	if (!user) {
		throw redirect(302, '/login');
	}

	// Cek apakah user punya akses admin
	if (!isAdmin(user)) {
		throw redirect(302, '/'); // Redirect ke homepage jika bukan admin
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			role: user.role
		}
	};
};
