type ApiToken = {
    id: string;
    user_id: string;
    name: string;
    revoked_at?: Date | null | undefined;
}

type EntityModel = {
    id: string;
    ref_id: string;
    name: string;
    alt_id?: string | null | undefined;
    active?: boolean | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

type PermissionAssignment = {
    id: string;
    permission_id: string;
    user_id?: string | null | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
    role_id?: string | null | undefined;
}

type Permission = {
    id: string;
    name: string;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
    description?: string | null | undefined;
}

type Role = {
    id: string;
    name: string;
    description?: string | null | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

type SystemPermission = {
    id: string;
    permission: string;
    user_id: string;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

type TransactionModel = {
    id: string;
    ref_id: string;
    name: string;
    alt_id?: string | null | undefined;
    active?: boolean | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

type UnitModel = {
    id: string;
    ref_id: string;
    name: string;
    alt_id?: string | null | undefined;
    active?: boolean | undefined;
    base_unit_id?: string | null | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

type User = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

type UserRole = {
    id: string;
    user_id: string;
    role_id: string;
    created_at?: Date | undefined;
    updated_at?: Date | null | undefined;
}

