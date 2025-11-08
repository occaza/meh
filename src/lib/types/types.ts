export type Product = {
	id: string;
	name: string;
	price: number;
	description: string;
};

export type Transaction = {
	order_id: string;
	amount: number;
	status: 'pending' | 'completed' | 'expired' | 'failed';
	product_id: string;
	payment_method?: string;
	completed_at?: string;
};
