import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { Pagination } from 'src/hooks/api';

import type {
  BulkCreateClientsResult,
  ClientDetail,
  ClientListItem,
  CreateClientPayload,
  FetchClientsListParams,
  UpdateClientPayload,
} from './types';

export async function fetchClientsList(
  params: FetchClientsListParams
): Promise<Pagination<ClientListItem>> {
  return request<Pagination<ClientListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.clients.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ...(params.groupId ? { groupId: params.groupId } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function fetchClientDetail(id: string): Promise<ClientDetail> {
  return request<ClientDetail>({
    method: 'GET',
    url: API_ENDPOINTS.clients.detail(id),
  });
}

export async function createClient(payload: CreateClientPayload): Promise<ClientListItem> {
  return request<ClientListItem>({
    method: 'POST',
    url: API_ENDPOINTS.clients.list,
    data: {
      name: payload.name,
      lastName: payload.lastName ?? '',
      middleName: payload.middleName ?? '',
      birthDate: payload.birthDate ?? null,
      communicationLanguage: payload.communicationLanguage ?? '',
      gender: payload.gender ?? '',
      maritalStatus: payload.maritalStatus ?? '',
      phones: payload.phones,
      addresses: payload.addresses ?? [],
      socialNetworks: payload.socialNetworks ?? {},
      groups: payload.groups ?? [],
    },
  });
}

export async function deleteClient(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.clients.detail(id),
  });
}

export async function bulkDeleteClients(ids: string[]): Promise<void> {
  await request<void>({
    method: 'POST',
    url: API_ENDPOINTS.clients.bulkDelete,
    data: { ids },
  });
}

export async function bulkCreateClientsFromExcel(file: File): Promise<BulkCreateClientsResult> {
  const formData = new FormData();
  formData.append('file', file);

  return request<BulkCreateClientsResult>({
    method: 'POST',
    url: API_ENDPOINTS.clients.bulkCreateExcel,
    data: formData,
  });
}

export async function updateClient(payload: UpdateClientPayload): Promise<ClientListItem> {
  return request<ClientListItem>({
    method: 'PATCH',
    url: API_ENDPOINTS.clients.detail(payload.id),
    data: {
      name: payload.name,
      lastName: payload.lastName ?? '',
      middleName: payload.middleName ?? '',
      birthDate: payload.birthDate ?? null,
      communicationLanguage: payload.communicationLanguage ?? '',
      gender: payload.gender ?? '',
      maritalStatus: payload.maritalStatus ?? '',
      phones: payload.phones,
      addresses: payload.addresses ?? [],
      socialNetworks: payload.socialNetworks ?? {},
      groups: payload.groups ?? [],
    },
  });
}
