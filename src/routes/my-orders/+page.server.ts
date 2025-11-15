import { getUser } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await getUser(cookies);

	return {
		user: user
			? {
					id: user.id,
					email: user.email,
					role: user.role
				}
			: null
	};
};
