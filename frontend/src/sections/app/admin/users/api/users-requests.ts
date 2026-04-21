import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { Pagination } from 'src/hooks/api';
import type { TokenPairResponse } from 'src/auth/api/types';

import type {
  CreateTenantUserPayload,
  FetchTenantUsersParams,
  LocationDistrict,
  LocationRegion,
  TenantUserDetail,
  TenantUserListItem,
  UpdateTenantUserPayload,
} from './types';

export async function fetchTenantUsers(
  params: FetchTenantUsersParams
): Promise<Pagination<TenantUserListItem>> {
  return request<Pagination<TenantUserListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.auth.users,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function fetchTenantUserDetail(id: string): Promise<TenantUserDetail> {
  return request<TenantUserDetail>({
    method: 'GET',
    url: API_ENDPOINTS.auth.userDetail(id),
  });
}

export async function fetchRegions(): Promise<LocationRegion[]> {
  return request<LocationRegion[]>({
    method: 'GET',
    url: API_ENDPOINTS.locations.regions,
  });
}

export async function fetchDistricts(regionId: string): Promise<LocationDistrict[]> {
  return request<LocationDistrict[]>({
    method: 'GET',
    url: API_ENDPOINTS.locations.regionDistricts(regionId),
  });
}

export async function impersonateTenantUser(userId: string): Promise<TokenPairResponse> {
  return request<TokenPairResponse>({
    method: 'POST',
    url: API_ENDPOINTS.auth.impersonate,
    data: { userId },
  });
}

export async function createTenantUser(payload: CreateTenantUserPayload): Promise<TenantUserListItem> {
  return request<TenantUserListItem>({
    method: 'POST',
    url: API_ENDPOINTS.auth.users,
    data: payload,
  });
}

export async function updateTenantUser(payload: UpdateTenantUserPayload): Promise<TenantUserDetail> {
  const { id, ...rest } = payload;
  return request<TenantUserDetail>({
    method: 'PATCH',
    url: API_ENDPOINTS.auth.userDetail(id),
    data: rest,
  });
}

export async function deleteTenantUser(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.auth.userDetail(id),
  });
}
