import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { DebtListItem, FetchDebtsListParams } from './types';

export async function fetchDebtsList(params: FetchDebtsListParams): Promise<Pagination<DebtListItem>> {
  return request<Pagination<DebtListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.debts.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ordering: params.ordering ?? '-created_at',
      ...(params.status ? { status: params.status } : {}),
    },
  });
}
