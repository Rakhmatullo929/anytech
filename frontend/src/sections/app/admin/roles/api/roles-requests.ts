import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { TenantRole, TenantRolesResponse, UpdateTenantRolePermissionsPayload } from './types';

export async function fetchTenantRoles(): Promise<TenantRolesResponse> {
  return request<TenantRolesResponse>({
    method: 'GET',
    url: API_ENDPOINTS.auth.roles,
  });
}

export async function updateTenantRolePermissions(
  payload: UpdateTenantRolePermissionsPayload
): Promise<TenantRole> {
  return request<TenantRole>({
    method: 'PATCH',
    url: API_ENDPOINTS.auth.rolePermissions(payload.role),
    data: { permissions: payload.permissions },
  });
}
