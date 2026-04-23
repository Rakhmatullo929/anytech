import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { Pagination } from 'src/hooks/api';

import type {
  Group,
  GroupsListParams,
  CreateGroupPayload,
  UpdateGroupPayload,
} from './types';

export async function fetchGroupsList(params: GroupsListParams): Promise<Pagination<Group>> {
  return request<Pagination<Group>>({
    method: 'GET',
    url: API_ENDPOINTS.clients.groups.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  return request<Group>({
    method: 'POST',
    url: API_ENDPOINTS.clients.groups.list,
    data: {
      name: payload.name,
      description: payload.description ?? '',
    },
  });
}

export async function updateGroup(payload: UpdateGroupPayload): Promise<Group> {
  return request<Group>({
    method: 'PATCH',
    url: API_ENDPOINTS.clients.groups.detail(payload.id),
    data: {
      name: payload.name,
      description: payload.description ?? '',
    },
  });
}

export async function deleteGroup(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.clients.groups.detail(id),
  });
}

export async function bulkDeleteGroups(ids: string[]): Promise<void> {
  await request<void>({
    method: 'POST',
    url: API_ENDPOINTS.clients.groups.bulkDelete,
    data: { ids },
  });
}
