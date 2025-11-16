// src/routes/api/profile/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { getUser } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const user = await getUser(cookies);

		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Get profile
		const { data: profile } = await supabaseAdmin
			.from('user_profiles')
			.select('*')
			.eq('user_id', user.id)
			.single();

		// Get user role
		const { data: roleData } = await supabaseAdmin
			.from('user_roles')
			.select('full_name, phone_number')
			.eq('user_id', user.id)
			.single();

		return json({
			id: user.id,
			email: user.email,
			role: user.role, // Tambah ini
			full_name: roleData?.full_name || '',
			phone_number: roleData?.phone_number || '',
			avatar_url: profile?.avatar_url || null,
			bio: profile?.bio || ''
		});
	} catch (error) {
		console.error('Get profile error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		const user = await getUser(cookies);

		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { full_name, phone_number, bio, avatar_url } = body;

		const supabaseAdmin = getSupabaseAdmin();

		// Update user_roles
		const { error: roleError } = await supabaseAdmin
			.from('user_roles')
			.update({
				full_name: full_name || null,
				phone_number: phone_number || null
			})
			.eq('user_id', user.id);

		if (roleError) {
			console.error('Update role error:', roleError);
			return json({ error: 'Failed to update profile' }, { status: 500 });
		}

		// Update atau insert user_profiles
		const { data: existingProfile } = await supabaseAdmin
			.from('user_profiles')
			.select('id')
			.eq('user_id', user.id)
			.single();

		if (existingProfile) {
			const { error: profileError } = await supabaseAdmin
				.from('user_profiles')
				.update({
					avatar_url: avatar_url || null,
					bio: bio || null,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (profileError) {
				console.error('Update profile error:', profileError);
				return json({ error: 'Failed to update profile' }, { status: 500 });
			}
		} else {
			const { error: insertError } = await supabaseAdmin.from('user_profiles').insert({
				user_id: user.id,
				avatar_url: avatar_url || null,
				bio: bio || null
			});

			if (insertError) {
				console.error('Insert profile error:', insertError);
				return json({ error: 'Failed to create profile' }, { status: 500 });
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Update profile error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
