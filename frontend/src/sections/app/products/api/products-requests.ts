import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type {
  CategoryListItem,
  CreateProductPurchasePayload,
  CreateProductPayload,
  FetchProductPurchasesListParams,
  FetchProductsListParams,
  ProductPurchaseListItem,
  ProductDetail,
  ProductListItem,
  UpdateProductPurchasePayload,
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
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductListItem> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('sku', payload.sku?.trim() ? payload.sku.trim() : '');
  if (payload.category) {
    formData.append('category', payload.category);
  }
  payload.images?.forEach((file) => formData.append('uploaded_images', file));

  return request<ProductListItem>({
    method: 'POST',
    url: API_ENDPOINTS.products.list,
    data: formData,
  });
}

export async function fetchProductDetail(id: string): Promise<ProductDetail> {
  return request<ProductDetail>({
    method: 'GET',
    url: API_ENDPOINTS.products.detail(id),
  });
}

export async function updateProduct(payload: UpdateProductPayload): Promise<ProductListItem> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('sku', payload.sku?.trim() ? payload.sku.trim() : '');
  if (payload.category) {
    formData.append('category', payload.category);
  }
  payload.images?.forEach((file) => formData.append('uploaded_images', file));

  return request<ProductListItem>({
    method: 'PUT',
    url: API_ENDPOINTS.products.detail(payload.id),
    data: formData,
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

export async function fetchCategoriesList(): Promise<Pagination<CategoryListItem>> {
  return request<Pagination<CategoryListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.categories.list,
    params: {
      page: 1,
      pageSize: 200,
      ordering: 'name',
    },
  });
}

export async function fetchProductPurchasesList(
  params: FetchProductPurchasesListParams
): Promise<Pagination<ProductPurchaseListItem>> {
  return request<Pagination<ProductPurchaseListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.productPurchases.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      productId: params.productId,
      ...(params.search ? { search: params.search } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function createProductPurchase(
  payload: CreateProductPurchasePayload
): Promise<ProductPurchaseListItem> {
  return request<ProductPurchaseListItem>({
    method: 'POST',
    url: API_ENDPOINTS.productPurchases.list,
    data: payload,
  });
}

export async function updateProductPurchase(
  payload: UpdateProductPurchasePayload
): Promise<ProductPurchaseListItem> {
  return request<ProductPurchaseListItem>({
    method: 'PUT',
    url: API_ENDPOINTS.productPurchases.detail(payload.id),
    data: {
      product: payload.product,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
    },
  });
}

export async function deleteProductPurchase(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.productPurchases.detail(id),
  });
}

export async function bulkDeleteProductPurchases(ids: string[]): Promise<void> {
  await request<void>({
    method: 'POST',
    url: API_ENDPOINTS.productPurchases.bulkDelete,
    data: { ids },
  });
}
