import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { deleteFromList, type Pagination, updateList, updateObject, useFetchList, useFetchOne, useMutate } from 'src/hooks/api';

import { addClientsToGroup, bulkDeleteGroups, createGroup, deleteGroup, fetchGroupDetail, fetchGroupsList, removeClientsFromGroup, updateGroup } from './groups-requests';
import type { AddClientsToGroupPayload, CreateGroupPayload, FetchGroupsListParams, GroupDetail, GroupListItem, RemoveClientsFromGroupPayload, UpdateGroupPayload } from './types';

export function useGroupsListQuery(params: FetchGroupsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () => ['clients-groups', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<GroupListItem>(queryKey, () => fetchGroupsList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useGroupDetailQuery(id: string) {
  const queryKey = useMemo(() => ['clients-groups', 'detail', id] as const, [id]);
  return useFetchOne<GroupDetail>(queryKey, () => fetchGroupDetail(id), {
    enabled: Boolean(id),
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutate<GroupListItem, CreateGroupPayload>(createGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-groups', 'list'] });
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutate<GroupListItem, UpdateGroupPayload>(updateGroup, {
    onSuccess: (updatedGroup) => {
      queryClient.setQueriesData<Pagination<GroupListItem> | undefined>(
        { queryKey: ['clients-groups', 'list'] },
        updateList(updatedGroup)
      );
      queryClient.setQueryData<GroupDetail | undefined>(
        ['clients-groups', 'detail', updatedGroup.id],
        updateObject<GroupDetail>(updatedGroup)
      );
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutate<void, string>(deleteGroup, {
    onSuccess: (_, deletedGroupId) => {
      queryClient.setQueriesData<Pagination<GroupListItem> | undefined>(
        { queryKey: ['clients-groups', 'list'] },
        deleteFromList(deletedGroupId)
      );
      queryClient.removeQueries({ queryKey: ['clients-groups', 'detail', deletedGroupId] });
    },
  });
}

export function useAddClientsToGroupMutation() {
  const queryClient = useQueryClient();
  return useMutate<void, AddClientsToGroupPayload>(addClientsToGroup, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['clients-groups', 'detail', variables.groupId] });
    },
  });
}

export function useRemoveClientsFromGroupMutation() {
  const queryClient = useQueryClient();
  return useMutate<void, RemoveClientsFromGroupPayload>(removeClientsFromGroup, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['clients-groups', 'detail', variables.groupId] });
    },
  });
}

export function useBulkDeleteGroupsMutation() {
  const queryClient = useQueryClient();
  return useMutate<void, string[]>(bulkDeleteGroups, {
    onSuccess: (_, deletedIds) => {
      queryClient.setQueriesData<Pagination<GroupListItem> | undefined>(
        { queryKey: ['clients-groups', 'list'] },
        (old) => {
          if (!old) return old;
          const deletedSet = new Set(deletedIds);
          const nextResults = old.results.filter((row) => !deletedSet.has(String(row.id)));
          return {
            ...old,
            results: nextResults,
            count: Math.max(0, old.count - (old.results.length - nextResults.length)),
          };
        }
      );
      deletedIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: ['clients-groups', 'detail', id] });
      });
    },
  });
}
