// src/lib/utils/upload.utils.ts
import { getSupabaseClient } from '$lib/client/supabase';

export async function uploadProductImage(file: File): Promise<string | null> {
	try {
		const supabase = getSupabaseClient();

		// Generate unique filename
		const fileExt = file.name.split('.').pop();
		const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
		const filePath = `products/${fileName}`;

		// Upload file
		const { error: uploadError } = await supabase.storage
			.from('product-images')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('Upload error:', uploadError);
			return null;
		}

		// Get public URL
		const {
			data: { publicUrl }
		} = supabase.storage.from('product-images').getPublicUrl(filePath);

		return publicUrl;
	} catch (error) {
		console.error('Upload failed:', error);
		return null;
	}
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
	try {
		const supabase = getSupabaseClient();

		// Extract path from URL
		const url = new URL(imageUrl);
		const path = url.pathname.split('/product-images/')[1];

		if (!path) return false;

		const { error } = await supabase.storage.from('product-images').remove([path]);

		if (error) {
			console.error('Delete error:', error);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Delete failed:', error);
		return false;
	}
}
