import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { ExportSalesParams, FetchSalesListParams, SaleDetail, SaleListItem } from './types';

export async function fetchSalesList(params: FetchSalesListParams): Promise<Pagination<SaleListItem>> {
  return request<Pagination<SaleListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.sales.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ordering: params.ordering ?? '-created_at',
      ...(params.paymentType ? { payment_type: params.paymentType } : {}),
      ...(params.clientIds ? { client_ids: params.clientIds } : {}),
      ...(params.sellerIds ? { seller_ids: params.sellerIds } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
      ...(params.amountFrom ? { amount_from: params.amountFrom } : {}),
      ...(params.amountTo ? { amount_to: params.amountTo } : {}),
    },
  });
}

export async function exportSalesExcel(params: ExportSalesParams): Promise<void> {
  const response = await request<Blob>({
    method: 'GET',
    url: API_ENDPOINTS.sales.exportExcel,
    responseType: 'blob',
    params: {
      ordering: params.ordering ?? '-created_at',
      ...(params.paymentType ? { payment_type: params.paymentType } : {}),
      ...(params.clientIds ? { client_ids: params.clientIds } : {}),
      ...(params.sellerIds ? { seller_ids: params.sellerIds } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
      ...(params.amountFrom ? { amount_from: params.amountFrom } : {}),
      ...(params.amountTo ? { amount_to: params.amountTo } : {}),
    },
  });
  const url = window.URL.createObjectURL(response as unknown as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sales_export.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function fetchSaleDetail(id: string): Promise<SaleDetail> {
  return request<SaleDetail>({
    method: 'GET',
    url: API_ENDPOINTS.sales.detail(id),
  });
}
