import type { Pagination } from 'src/hooks/api';
import { request, apiClient, API_ENDPOINTS } from 'src/utils/axios';

import type {
  BulkCreateProductsResult,
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
      // Comma-joined → humps converts key to category_ids on the wire
      ...(params.categoryIds?.length ? { categoryIds: params.categoryIds.join(',') } : {}),
      ...(params.minQuantity ? { minQuantity: params.minQuantity } : {}),
      ...(params.maxQuantity ? { maxQuantity: params.maxQuantity } : {}),
      ...(params.inStock ? { inStock: true } : {}),
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
  payload.keepImageIds?.forEach((imageId) => formData.append('keep_image_ids', imageId));
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

export async function bulkCreateProductsFromExcel(file: File): Promise<BulkCreateProductsResult> {
  const formData = new FormData();
  formData.append('file', file);

  return request<BulkCreateProductsResult>({
    method: 'POST',
    url: API_ENDPOINTS.products.bulkCreateExcel,
    data: formData,
  });
}

export async function downloadProductExcelTemplate(): Promise<void> {
  const response = await apiClient.get(API_ENDPOINTS.products.downloadExcelTemplate, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'products_template.xlsx');
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export async function exportProductsExcel(params: Omit<FetchProductsListParams, 'page' | 'pageSize'>): Promise<void> {
  const response = await apiClient.get(API_ENDPOINTS.products.exportExcel, {
    responseType: 'blob',
    params: {
      ...(params.search ? { search: params.search } : {}),
      ...(params.categoryIds?.length ? { categoryIds: params.categoryIds.join(',') } : {}),
      ...(params.minQuantity ? { minQuantity: params.minQuantity } : {}),
      ...(params.maxQuantity ? { maxQuantity: params.maxQuantity } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'products_export.xlsx');
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}
