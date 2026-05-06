import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { DebtDetail, DebtListItem, FetchDebtsListParams, PayDebtPayload } from './types';

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

export async function fetchDebtDetail(id: string): Promise<DebtDetail> {
  return request<DebtDetail>({
    method: 'GET',
    url: API_ENDPOINTS.debts.detail(id),
  });
}

export async function payDebt(id: string, payload: PayDebtPayload): Promise<DebtDetail> {
  return request<DebtDetail>({
    method: 'POST',
    url: API_ENDPOINTS.debts.pay(id),
    data: payload,
  });
}
