import { request, API_ENDPOINTS } from 'src/utils/axios';

import type {
  CreateTenantRolePayload,
  TenantRole,
  TenantRolesResponse,
  UpdateTenantRolePayload,
  UpdateTenantRolePermissionsPayload,
} from './types';

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

export async function createTenantRole(payload: CreateTenantRolePayload): Promise<TenantRole> {
  return request<TenantRole>({
    method: 'POST',
    url: API_ENDPOINTS.auth.roleCreate,
    data: payload,
  });
}

export async function deleteTenantRole(role: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.auth.roleDelete(role),
  });
}

export async function updateTenantRole(payload: UpdateTenantRolePayload): Promise<TenantRole> {
  return request<TenantRole>({
    method: 'PATCH',
    url: API_ENDPOINTS.auth.roleDelete(payload.role),
    data: { name: payload.name },
  });
}
