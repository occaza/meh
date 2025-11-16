// src/routes/api/admin/products/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabase';
import { requireRole } from '$lib/server/auth';
import { extractIdFromSlug, generateUniqueSlug } from '$lib/utils/slug.utils';
import type { RequestHandler } from './$types';

// GET - Ambil data produk untuk edit (bisa terima ID atau slug)
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const { id } = params;
		const supabaseAdmin = getSupabaseAdmin();

		// Coba cari by id dulu
		let { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();

		// Jika tidak ketemu, coba extract dari slug
		if (error || !data) {
			const extractedId = extractIdFromSlug(id);
			if (extractedId) {
				const result = await supabaseAdmin
					.from('products')
					.select('*')
					.ilike('id', `%${extractedId}`)
					.single();
				data = result.data;
				error = result.error;
			}
		}

		if (error || !data) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		return json(data);
	} catch (error) {
		console.error('Get product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT - Update produk
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const { id } = params;
		const body = await request.json();
		const {
			name,
			description,
			detail_description,
			price,
			images,
			stock,
			discount_percentage,
			discount_end_date,
			faq // Tambah ini
		} = body;

		if (!name || !description || price === undefined) {
			return json({ error: 'Field wajib harus diisi' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();

		// Get product ID yang sebenarnya
		let productId = id;
		const extractedId = extractIdFromSlug(id);
		if (extractedId) {
			const { data: existing } = await supabaseAdmin
				.from('products')
				.select('id')
				.ilike('id', `%${extractedId}`)
				.single();
			if (existing) productId = existing.id;
		}

		// Generate slug baru jika nama berubah
		const newSlug = generateUniqueSlug(name, productId);

		const { data, error } = await supabaseAdmin
			.from('products')
			.update({
				name: name.trim(),
				slug: newSlug,
				description: description.trim(),
				detail_description: detail_description?.trim() || description.trim(),
				price: parseInt(price.toString()),
				images: images || [],
				stock: stock !== undefined ? parseInt(stock.toString()) : 0,
				discount_percentage: discount_percentage ? parseInt(discount_percentage.toString()) : null,
				discount_end_date: discount_end_date || null,
				faq: faq || null // Tambah baris ini
			})
			.eq('id', productId)
			.select()
			.single();

		if (error) {
			console.error('Update product error:', error);
			return json({ error: 'Gagal update produk' }, { status: 500 });
		}

		return json(data);
	} catch (error) {
		console.error('Update product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE - Hapus produk
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		await requireRole(cookies, ['superadmin']);

		const { id } = params;
		const supabaseAdmin = getSupabaseAdmin();

		// Get product ID yang sebenarnya
		let productId = id;
		const extractedId = extractIdFromSlug(id);
		if (extractedId) {
			const { data: existing } = await supabaseAdmin
				.from('products')
				.select('id')
				.ilike('id', `%${extractedId}`)
				.single();
			if (existing) productId = existing.id;
		}

		const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);

		if (error) {
			console.error('Delete product error:', error);
			return json({ error: 'Gagal hapus produk' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Delete product error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
