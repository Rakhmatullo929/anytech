import type { Pagination } from 'src/hooks/api';
import { API_ENDPOINTS, request } from 'src/utils/axios';

import type {
  CreateGroupPayload,
  FetchGroupsListParams,
  GroupDetail,
  GroupListItem,
  UpdateGroupPayload,
} from './types';

export async function fetchGroupsList(params: FetchGroupsListParams): Promise<Pagination<GroupListItem>> {
  return request<Pagination<GroupListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.clients.groupsList,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function fetchGroupDetail(id: string): Promise<GroupDetail> {
  return request<GroupDetail>({
    method: 'GET',
    url: API_ENDPOINTS.clients.groupsDetail(id),
  });
}

export async function createGroup(payload: CreateGroupPayload): Promise<GroupListItem> {
  return request<GroupListItem>({
    method: 'POST',
    url: API_ENDPOINTS.clients.groupsList,
    data: {
      name: payload.name,
      description: payload.description ?? '',
    },
  });
}

export async function updateGroup(payload: UpdateGroupPayload): Promise<GroupListItem> {
  return request<GroupListItem>({
    method: 'PATCH',
    url: API_ENDPOINTS.clients.groupsDetail(payload.id),
    data: {
      name: payload.name,
      description: payload.description ?? '',
    },
  });
}

export async function deleteGroup(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.clients.groupsDetail(id),
  });
}

export async function bulkDeleteGroups(ids: string[]): Promise<void> {
  await request<void>({
    method: 'POST',
    url: API_ENDPOINTS.clients.groupsBulkDelete,
    data: { ids },
  });
}
