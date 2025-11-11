// src/lib/utils/upload.utils.ts
import { getSupabaseClient } from '$lib/client/supabase';

export type UploadResult = {
	success: boolean;
	url?: string;
	error?: string;
};

export async function uploadProductImage(file: File): Promise<UploadResult> {
	try {
		const supabase = getSupabaseClient();

		// Validasi file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			console.error('Invalid file type:', file.type);
			return {
				success: false,
				error: `Format file tidak didukung: ${file.name}. Gunakan JPG, PNG, atau WEBP`
			};
		}

		// Validasi file size (max 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
			return {
				success: false,
				error: `File terlalu besar: ${file.name} (${sizeMB}MB). Maksimal 5MB`
			};
		}

		// Generate unique filename
		const fileExt = file.name.split('.').pop();
		const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
		const filePath = `products/${fileName}`;

		console.log('Uploading file:', { fileName, size: file.size, type: file.type });

		// Upload file
		const { data, error: uploadError } = await supabase.storage
			.from('product-images')
			.upload(filePath, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (uploadError) {
			console.error('Upload error:', uploadError);

			if (uploadError.message.includes('row-level security')) {
				return {
					success: false,
					error: 'Anda tidak memiliki akses untuk upload gambar. Pastikan Anda sudah login.'
				};
			} else if (uploadError.message.includes('duplicate')) {
				return {
					success: false,
					error: `File dengan nama yang sama sudah ada: ${file.name}`
				};
			} else {
				return {
					success: false,
					error: `Upload gagal: ${uploadError.message}`
				};
			}
		}

		console.log('Upload success:', data);

		// Get public URL
		const {
			data: { publicUrl }
		} = supabase.storage.from('product-images').getPublicUrl(filePath);

		console.log('Public URL:', publicUrl);

		return {
			success: true,
			url: publicUrl
		};
	} catch (error) {
		console.error('Upload failed:', error);
		return {
			success: false,
			error: 'Terjadi kesalahan saat upload gambar'
		};
	}
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
	try {
		const supabase = getSupabaseClient();

		const url = new URL(imageUrl);
		const pathMatch = url.pathname.match(/\/product-images\/(.+)$/);

		if (!pathMatch || !pathMatch[1]) {
			console.error('Invalid image URL format:', imageUrl);
			return false;
		}

		const path = pathMatch[1];
		console.log('Deleting file:', path);

		const { error } = await supabase.storage.from('product-images').remove([path]);

		if (error) {
			console.error('Delete error:', error);
			return false;
		}

		console.log('Delete success');
		return true;
	} catch (error) {
		console.error('Delete failed:', error);
		return false;
	}
}
