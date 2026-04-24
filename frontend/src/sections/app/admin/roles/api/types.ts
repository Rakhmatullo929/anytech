export type TenantRole = {
  value: string;
  label: string;
  permissions: string[];
  isSystem?: boolean;
};

export type TenantRolesResponse = {
  results: TenantRole[];
  availablePermissions: string[];
};

export type UpdateTenantRolePermissionsPayload = {
  role: string;
  permissions: string[];
};

export type CreateTenantRolePayload = {
  name: string;
};

export type UpdateTenantRolePayload = {
  role: string;
  name: string;
};
