import { API_ENDPOINTS } from 'src/lib/api/endpoints';
import { request } from 'src/utils/axios';

import type { TenantUserDetail } from 'src/sections/app/admin/users/api/types';

export async function fetchMyProfile(): Promise<TenantUserDetail> {
  const { user } = await request<{ user: TenantUserDetail }>({
    method: 'GET',
    url: API_ENDPOINTS.auth.me,
  });
  return user;
}
