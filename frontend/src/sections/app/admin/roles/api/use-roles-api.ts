import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFetch, useMutate } from 'src/hooks/api';

import {
  createTenantRole,
  deleteTenantRole,
  fetchTenantRoles,
  updateTenantRole,
  updateTenantRolePermissions,
} from './roles-requests';
import type {
  CreateTenantRolePayload,
  TenantRole,
  TenantRolesResponse,
  UpdateTenantRolePayload,
  UpdateTenantRolePermissionsPayload,
} from './types';

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

export function useCreateTenantRoleMutation() {
  const queryClient = useQueryClient();
  return useMutate<TenantRole, CreateTenantRolePayload>(createTenantRole, {
    onSuccess: (createdRole) => {
      queryClient.setQueryData<TenantRolesResponse | undefined>(['roles', 'list'], (current) => {
        if (!current) return current;
        return { ...current, results: [...current.results, createdRole] };
      });
    },
  });
}

export function useDeleteTenantRoleMutation() {
  const queryClient = useQueryClient();
  return useMutate<void, string>(deleteTenantRole, {
    onSuccess: (_, roleCode) => {
      queryClient.setQueryData<TenantRolesResponse | undefined>(['roles', 'list'], (current) => {
        if (!current) return current;
        return { ...current, results: current.results.filter((item) => item.value !== roleCode) };
      });
    },
  });
}

export function useUpdateTenantRoleMutation() {
  const queryClient = useQueryClient();
  return useMutate<TenantRole, UpdateTenantRolePayload>(updateTenantRole, {
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
