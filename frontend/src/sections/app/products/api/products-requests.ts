import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type {
  CreateProductPayload,
  FetchProductsListParams,
  ProductDetail,
  ProductListItem,
  UpdateProductPayload,
} from './types';

export async function fetchProductsList(
  params: FetchProductsListParams
): Promise<Pagination<ProductListItem>> {
  return request<Pagination<ProductListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.products.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductListItem> {
  return request<ProductListItem>({
    method: 'POST',
    url: API_ENDPOINTS.products.list,
    data: {
      name: payload.name,
      sku: payload.sku?.trim() ? payload.sku.trim() : null,
      purchasePrice: payload.purchasePrice,
      salePrice: payload.salePrice,
      stock: payload.stock,
    },
  });
}

export async function fetchProductDetail(id: string): Promise<ProductDetail> {
  return request<ProductDetail>({
    method: 'GET',
    url: API_ENDPOINTS.products.detail(id),
  });
}

export async function updateProduct(payload: UpdateProductPayload): Promise<ProductListItem> {
  return request<ProductListItem>({
    method: 'PUT',
    url: API_ENDPOINTS.products.detail(payload.id),
    data: {
      name: payload.name,
      sku: payload.sku?.trim() ? payload.sku.trim() : null,
      purchasePrice: payload.purchasePrice,
      salePrice: payload.salePrice,
    },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.products.detail(id),
  });
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  await request<void>({
    method: 'POST',
    url: API_ENDPOINTS.products.bulkDelete,
    data: { ids },
  });
}
