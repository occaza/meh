// src/lib/types/types.ts
export type Product = {
	id: string;
	name: string;
	price: number;
	description: string;
	detail_description?: string;
	images?: string[];
	stock: number;
	discount_percentage?: number;
	discount_end_date?: string;
	created_at?: string;
};

export type Transaction = {
	order_id: string;
	amount: number;
	status: 'pending' | 'completed' | 'expired' | 'failed';
	product_id: string;
	payment_method?: string;
	completed_at?: string;
};

export type CartItem = {
	id: string;
	user_id: string;
	product_id: string;
	quantity: number;
	created_at: string;
	updated_at: string;
	product?: Product;
};
