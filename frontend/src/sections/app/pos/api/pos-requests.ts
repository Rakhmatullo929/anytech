import { request, API_ENDPOINTS } from 'src/utils/axios';

import type { CreateSalePayload, SaleListItem } from './types';

export async function createSale(payload: CreateSalePayload): Promise<SaleListItem> {
  return request<SaleListItem>({
    method: 'POST',
    url: API_ENDPOINTS.sales.list,
    data: {
      client: payload.client,
      paymentType: payload.paymentType,
      items: payload.items,
    },
  });
}
