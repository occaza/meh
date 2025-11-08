import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';

export async function GET() {
	const { data, error } = await supabaseAdmin.from('products').select('id, name, price');

	if (error) {
		return json({ error: 'Gagal memuat produk' }, { status: 500 });
	}

	return json(data);
}
