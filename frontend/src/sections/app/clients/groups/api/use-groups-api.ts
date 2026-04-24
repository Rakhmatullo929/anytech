import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { deleteFromList, type Pagination, updateList, updateObject, useFetchList, useFetchOne, useMutate } from 'src/hooks/api';

import { createGroup, deleteGroup, fetchGroupDetail, fetchGroupsList, updateGroup } from './groups-requests';
import type { CreateGroupPayload, FetchGroupsListParams, GroupDetail, GroupListItem, UpdateGroupPayload } from './types';

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
