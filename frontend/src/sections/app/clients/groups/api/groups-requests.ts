import type { Pagination } from 'src/hooks/api';
import { API_ENDPOINTS, request } from 'src/utils/axios';

import type { FetchGroupsListParams, GroupListItem } from './types';

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
