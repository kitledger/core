import { queryOptions } from "@tanstack/react-query";

export type SystemPermission = {
	id: string;
	permission: string;
}

export type Permission = {
	id: string;
	name: string;
	description?: string;
}

export type Role = {
	id: string;
	name: string;
	description?: string;
}


export type AuthUser = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	roles: Role[];
	permissions: Permission[];
	system_permissions: SystemPermission[];
};

export const userKeys = {
	auth: ["user"] as const,
};

export const fetchAuthUser = async (): Promise<AuthUser|null> => {
	const response = await fetch(`/api/v1/user`);

	if (!response.ok) {
		return null;
	}

	const data = await response.json();
	return data.data as AuthUser;
};

export const authUserQueryOptions = queryOptions({
	queryKey: userKeys.auth,
	queryFn: fetchAuthUser,
	staleTime: 5 * 60 * 1000,
});