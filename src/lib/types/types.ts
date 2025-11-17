// src/lib/types/types.ts
export type Product = {
	id: string;
	name: string;
	slug?: string;
	price: number;
	description: string;
	detail_description?: string;
	images?: string[];
	stock: number;
	discount_percentage?: number;
	discount_end_date?: string;
	created_at?: string;
	faq?: Array<{ question: string; answer: string }>; // Tambah ini
};

// Ubah ini
export type Transaction = {
	order_id: string;
	amount: number;
	status: 'pending' | 'processing' | 'completed' | 'expired' | 'failed'; // Tambah 'processing'
	product_id: string;
	payment_method?: string;
	completed_at?: string;
	processing_started_at?: string; // Tambah ini
	processed_by?: string; // Tambah ini
};

export type Coupon = {
	id: string;
	code: string;
	name: string;
	description?: string;
	discount_type: 'percentage' | 'fixed';
	discount_value: number;
	min_purchase: number;
	max_discount?: number;
	usage_limit?: number;
	usage_count: number;
	valid_from: string;
	valid_until?: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
};

export type CouponUsage = {
	id: string;
	coupon_id: string;
	user_id: string;
	order_id: string;
	discount_amount: number;
	used_at: string;
};

export type AppliedCoupon = {
	coupon: Coupon;
	discount_amount: number;
	final_amount: number;
};

// Tambahkan di bagian bawah file
export type CartNote = {
	id: string;
	cart_id: string;
	note: string;
	created_at: string;
	updated_at: string;
};

export type TransactionNote = {
	id: string;
	order_id: string;
	product_id: string;
	note: string;
	created_at: string;
};

// Update CartItem type
export type CartItem = {
	id: string;
	user_id: string;
	product_id: string;
	quantity: number;
	created_at: string;
	updated_at: string;
	product?: Product;
	note?: string; // Tambah ini
};
