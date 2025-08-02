export type ApiToken = {
	id: string;
	user_id: string;
	name: string;
	revoked_at?: Date | null | undefined;
};

export type EntityModel = {
	id: string;
	ref_id: string;
	name: string;
	alt_id?: string | null | undefined;
	active?: boolean | undefined;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};

export type PermissionAssignment = {
	id: string;
	permission_id: string;
	user_id?: string | null | undefined;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
	role_id?: string | null | undefined;
};

export type Permission = {
	id: string;
	name: string;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
	description?: string | null | undefined;
};

export type Role = {
	id: string;
	name: string;
	description?: string | null | undefined;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};

export type Session = {
	user_id: string;
	expires_at: number | string;
};

export type SystemPermission = {
	id: string;
	permission: string;
	user_id: string;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};

export type TransactionModel = {
	id: string;
	ref_id: string;
	name: string;
	alt_id?: string | null | undefined;
	active?: boolean | undefined;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};

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

export type User = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	password_hash: string;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};

export type UserRole = {
	id: string;
	user_id: string;
	role_id: string;
	created_at?: Date | undefined;
	updated_at?: Date | null | undefined;
};
