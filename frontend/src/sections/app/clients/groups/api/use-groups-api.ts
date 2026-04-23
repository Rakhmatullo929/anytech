import { useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import {
  deleteFromList,
  type Pagination,
  updateList,
  useFetchList,
  useMutate,
} from 'src/hooks/api';

import {
  bulkDeleteGroups,
  createGroup,
  deleteGroup,
  fetchGroupsList,
  updateGroup,
} from './groups-requests';
import type {
  CreateGroupPayload,
  Group,
  GroupsListParams,
  UpdateGroupPayload,
} from './types';

type GroupsListKeyParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

function getGroupsListKeyParams(queryKey: QueryKey): GroupsListKeyParams {
  const maybeParams = Array.isArray(queryKey) ? queryKey[2] : undefined;
  if (!maybeParams || typeof maybeParams !== 'object') {
    return {};
  }

  const params = maybeParams as Record<string, unknown>;
  return {
    page: typeof params.page === 'number' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'number' ? params.pageSize : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
    ordering: typeof params.ordering === 'string' ? params.ordering : undefined,
  };
}

export function useGroupsListQuery(params: GroupsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () =>
      [
        'groups',
        'list',
        { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' },
      ] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<Group>(queryKey, () => fetchGroupsList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutate<Group, CreateGroupPayload>(createGroup, {
    onSuccess: (createdGroup) => {
      const normalizedCreatedGroup: Group = {
        ...createdGroup,
        clientCount: createdGroup.clientCount ?? 0,
      };
      const cachedLists = queryClient.getQueriesData<Pagination<Group> | undefined>({
        queryKey: ['groups', 'list'],
      });

      cachedLists.forEach(([queryKey, cachedPage]) => {
        if (!cachedPage) return;

        const { page = 1, pageSize = cachedPage.results.length, search = '', ordering = '-created_at' } =
          getGroupsListKeyParams(queryKey);

        const shouldInsertIntoCurrentPage = page === 1 && ordering === '-created_at' && search.trim() === '';
        if (!shouldInsertIntoCurrentPage) return;

        const nextResults = [normalizedCreatedGroup, ...cachedPage.results];
        const trimmedResults = nextResults.slice(0, Math.max(1, pageSize));

        queryClient.setQueryData<Pagination<Group>>(queryKey, {
          ...cachedPage,
          count: cachedPage.count + 1,
          results: trimmedResults,
        });
      });
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutate<Group, UpdateGroupPayload>(updateGroup, {
    onSuccess: (updated) => {
      queryClient.setQueriesData<Pagination<Group> | undefined>(
        { queryKey: ['groups', 'list'] },
        updateList(updated)
      );
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string>(deleteGroup, {
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData<Pagination<Group> | undefined>(
        { queryKey: ['groups', 'list'] },
        deleteFromList(deletedId)
      );
    },
  });
}

export function useBulkDeleteGroupsMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string[]>(bulkDeleteGroups, {
    onSuccess: (_, deletedIds) => {
      const deletedSet = new Set(deletedIds);
      queryClient.setQueriesData<Pagination<Group> | undefined>(
        { queryKey: ['groups', 'list'] },
        (old) => {
          if (!old) return old;
          const next = old.results.filter((g) => !deletedSet.has(g.id));
          return {
            ...old,
            results: next,
            count: Math.max(0, old.count - (old.results.length - next.length)),
          };
        }
      );
    },
  });
}
