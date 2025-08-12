export type TransactionModel = {
	id: string;
	ref_id: string;
	name: string;
	alt_id?: string | null | undefined;
	active?: boolean | undefined;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};