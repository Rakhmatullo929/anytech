import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  deleteFromList,
  type Pagination,
  updateList,
  useFetchList,
  useFetchOne,
  useMutate,
} from 'src/hooks/api';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import { fetchCurrentUser } from 'src/auth/api/auth-requests';
import type { TokenPairResponse } from 'src/auth/api/types';
import { useLocales } from 'src/locales';
import { useSnackbar } from 'src/components/snackbar';

import {
  createTenantUser,
  deleteTenantUser,
  fetchTenantUserDetail,
  fetchTenantUsers,
  impersonateTenantUser,
  updateTenantUser,
} from './users-requests';
import type {
  CreateTenantUserPayload,
  FetchTenantUsersParams,
  TenantUserDetail,
  TenantUserListItem,
  UpdateTenantUserPayload,
} from './types';

export function useTenantUsersListQuery(params: FetchTenantUsersParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () => ['users', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<TenantUserListItem>(queryKey, () => fetchTenantUsers(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useImpersonateTenantUserMutation() {
  const { syncSessionFromApiResponse } = useAuthContext();
  const queryClient = useQueryClient();
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();

  return useMutate<TokenPairResponse, string>(impersonateTenantUser, {
    skipGlobalErrorNotification: true,
    onSuccess: async (payload) => {
      // 1) Immediately switch session to impersonated token/user payload.
      // 2) Then hydrate from /auth/me using the new token to get authoritative permissions/profile.
      syncSessionFromApiResponse(payload);
      try {
        const { user } = await fetchCurrentUser();
        syncSessionFromApiResponse({ ...payload, user });
      } catch {
        enqueueSnackbar(tx('users.toasts.loginAsProfileSyncFailed'), { variant: 'error' });
      }
      queryClient.clear();
    },
  });
}

export function useTenantUserDetailQuery(id: string) {
  const queryKey = useMemo(() => ['users', 'detail', id] as const, [id]);

  return useFetchOne<TenantUserDetail>(queryKey, () => fetchTenantUserDetail(id), {
    enabled: Boolean(id),
  });
}

export function useCreateTenantUserMutation() {
  const queryClient = useQueryClient();

  return useMutate<TenantUserListItem, CreateTenantUserPayload>(createTenantUser, {
    onSuccess: (createdUser) => {
      const cachedLists = queryClient.getQueriesData<Pagination<TenantUserListItem> | undefined>({
        queryKey: ['users', 'list'],
      });

      cachedLists.forEach(([queryKey, cachedPage]) => {
        if (!cachedPage) return;
        const params = (Array.isArray(queryKey) && queryKey[2]) || {};
        const page = typeof (params as { page?: unknown }).page === 'number' ? (params as { page: number }).page : 1;
        const pageSize =
          typeof (params as { pageSize?: unknown }).pageSize === 'number'
            ? (params as { pageSize: number }).pageSize
            : cachedPage.results.length;
        const search = typeof (params as { search?: unknown }).search === 'string' ? (params as { search: string }).search : '';
        const ordering =
          typeof (params as { ordering?: unknown }).ordering === 'string'
            ? (params as { ordering: string }).ordering
            : '-created_at';

        const shouldInsert = page === 1 && ordering === '-created_at' && search.trim() === '';
        if (!shouldInsert) return;

        queryClient.setQueryData<Pagination<TenantUserListItem>>(queryKey, {
          ...cachedPage,
          count: cachedPage.count + 1,
          results: [createdUser, ...cachedPage.results].slice(0, Math.max(1, pageSize)),
        });
      });
    },
  });
}

export function useUpdateTenantUserMutation() {
  const queryClient = useQueryClient();

  return useMutate<TenantUserDetail, UpdateTenantUserPayload>(updateTenantUser, {
    onSuccess: (updatedUser) => {
      queryClient.setQueriesData<Pagination<TenantUserListItem> | undefined>(
        { queryKey: ['users', 'list'] },
        updateList(updatedUser)
      );
      queryClient.setQueryData<TenantUserDetail | undefined>(['users', 'detail', updatedUser.id], updatedUser);
    },
  });
}

export function useDeleteTenantUserMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string>(deleteTenantUser, {
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData<Pagination<TenantUserListItem> | undefined>(
        { queryKey: ['users', 'list'] },
        deleteFromList(deletedId)
      );
      queryClient.removeQueries({ queryKey: ['users', 'detail', deletedId] });
    },
  });
}
