import { redirect } from '@sveltejs/kit';
import { getUser } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await getUser(cookies);

	if (!user) {
		throw redirect(302, '/login');
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			role: user.role
		}
	};
};
