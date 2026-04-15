import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFetch, useMutate } from 'src/hooks/api';

import { fetchTenantRoles, updateTenantRolePermissions } from './roles-requests';
import type { TenantRole, TenantRolesResponse, UpdateTenantRolePermissionsPayload } from './types';

export function useTenantRolesQuery() {
  const queryKey = useMemo(() => ['roles', 'list'] as const, []);
  return useFetch<TenantRolesResponse>(queryKey, fetchTenantRoles);
}

export function useUpdateTenantRolePermissionsMutation() {
  const queryClient = useQueryClient();

  return useMutate<TenantRole, UpdateTenantRolePermissionsPayload>(updateTenantRolePermissions, {
    onSuccess: (updatedRole) => {
      queryClient.setQueryData<TenantRolesResponse | undefined>(['roles', 'list'], (current) => {
        if (!current) return current;
        return {
          ...current,
          results: current.results.map((item) => (item.value === updatedRole.value ? updatedRole : item)),
        };
      });
    },
  });
}
