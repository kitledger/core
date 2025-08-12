export type UnitModel = {
	id: string;
	ref_id: string;
	name: string;
	alt_id?: string | null | undefined;
	active?: boolean | undefined;
	base_unit_id?: string | null | undefined;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};