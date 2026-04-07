import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { Pagination } from 'src/hooks/api';

import type {
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
    data: payload,
  });
}

export async function deleteClient(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.clients.detail(id),
  });
}

export async function updateClient(payload: UpdateClientPayload): Promise<ClientListItem> {
  return request<ClientListItem>({
    method: 'PATCH',
    url: API_ENDPOINTS.clients.detail(payload.id),
    data: {
      name: payload.name,
      phone: payload.phone,
    },
  });
}
