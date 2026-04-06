import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { Pagination } from 'src/hooks/api';

import type { ClientDetail, ClientListItem, FetchClientsListParams } from './types';

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
