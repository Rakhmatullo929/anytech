import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { FetchSalesListParams, SaleDetail, SaleListItem } from './types';

export async function fetchSalesList(params: FetchSalesListParams): Promise<Pagination<SaleListItem>> {
  return request<Pagination<SaleListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.sales.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ordering: params.ordering ?? '-created_at',
      ...(params.paymentType ? { paymentType: params.paymentType } : {}),
    },
  });
}

export async function fetchSaleDetail(id: string): Promise<SaleDetail> {
  return request<SaleDetail>({
    method: 'GET',
    url: API_ENDPOINTS.sales.detail(id),
  });
}
