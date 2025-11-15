// src/lib/server/auth.ts
import { getSupabaseAdmin } from './supabase';
import type { Cookies } from '@sveltejs/kit';

export type UserRole = 'superadmin' | 'user';

export type UserWithRole = {
	id: string;
	email: string | undefined;
	role: UserRole;
};

export async function getUser(cookies: Cookies): Promise<UserWithRole | null> {
	const accessToken = cookies.get('sb-access-token');

	if (!accessToken) {
		return null;
	}

	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase.auth.getUser(accessToken);

	if (error || !data.user) {
		return null;
	}

	// Get user role
	const { data: roleData } = await supabase
		.from('user_roles')
		.select('role')
		.eq('user_id', data.user.id)
		.single();

	const role: UserRole = roleData?.role || 'user';

	return {
		id: data.user.id,
		email: data.user.email,
		role
	};
}

export async function requireAuth(cookies: Cookies): Promise<UserWithRole> {
	const user = await getUser(cookies);

	if (!user) {
		throw new Error('Unauthorized');
	}

	return user;
}

export async function requireRole(
	cookies: Cookies,
	allowedRoles: UserRole[]
): Promise<UserWithRole> {
	const user = await requireAuth(cookies);

	if (!allowedRoles.includes(user.role)) {
		throw new Error('Forbidden: Insufficient permissions');
	}

	return user;
}

// Helper functions
export function isSuperAdmin(user: UserWithRole | null): boolean {
	return user?.role === 'superadmin';
}

export function isUser(user: UserWithRole | null): boolean {
	return user?.role === 'user';
}
