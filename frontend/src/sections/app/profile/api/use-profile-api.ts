import { useFetchOne } from 'src/hooks/api';

import type { TenantUserDetail } from 'src/sections/app/admin/users/api/types';

import { fetchMyProfile } from './profile-requests';

const QUERY_KEY = ['auth', 'me'] as const;

export function useMyProfileQuery() {
  return useFetchOne<TenantUserDetail>(QUERY_KEY, fetchMyProfile);
}
