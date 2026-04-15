export type TenantRole = {
  value: 'admin' | 'manager' | 'seller';
  label: string;
  permissions: string[];
};

export type TenantRolesResponse = {
  results: TenantRole[];
  availablePermissions: string[];
};

export type UpdateTenantRolePermissionsPayload = {
  role: 'admin' | 'manager' | 'seller';
  permissions: string[];
};
