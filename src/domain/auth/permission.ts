const SYSTEM_PERMISSION_PREFIX = "KL_";
export const SYSTEM_ADMIN_PERMISSION = `${SYSTEM_PERMISSION_PREFIX}SYSTEM_ADMIN`;

export function getSystemPermissionKey(userId: string): [string, string] {
	return ["system_permissions", userId];
}
