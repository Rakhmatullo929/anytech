export {
  useTenantRolesQuery,
  useUpdateTenantRolePermissionsMutation,
  useCreateTenantRoleMutation,
  useDeleteTenantRoleMutation,
} from './use-roles-api';
export type {
  TenantRole,
  TenantRolesResponse,
  UpdateTenantRolePermissionsPayload,
  CreateTenantRolePayload,
} from './types';
