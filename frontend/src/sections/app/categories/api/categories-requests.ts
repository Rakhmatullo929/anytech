import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type {
  CategoryDetail,
  CategoryListItem,
  CreateCategoryPayload,
  FetchCategoriesListParams,
  UpdateCategoryPayload,
} from './types';

export async function fetchCategoriesList(
  params: FetchCategoriesListParams
): Promise<Pagination<CategoryListItem>> {
  return request<Pagination<CategoryListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.categories.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search ? { search: params.search } : {}),
      ordering: params.ordering ?? '-created_at',
    },
  });
}

export async function createCategory(payload: CreateCategoryPayload): Promise<CategoryListItem> {
  return request<CategoryListItem>({
    method: 'POST',
    url: API_ENDPOINTS.categories.list,
    data: {
      name: payload.name,
    },
  });
}

export async function fetchCategoryDetail(id: string): Promise<CategoryDetail> {
  return request<CategoryDetail>({
    method: 'GET',
    url: API_ENDPOINTS.categories.detail(id),
  });
}

export async function updateCategory(payload: UpdateCategoryPayload): Promise<CategoryListItem> {
  return request<CategoryListItem>({
    method: 'PUT',
    url: API_ENDPOINTS.categories.detail(payload.id),
    data: {
      name: payload.name,
    },
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await request<void>({
    method: 'DELETE',
    url: API_ENDPOINTS.categories.detail(id),
  });
}

export async function bulkDeleteCategories(ids: string[]): Promise<void> {
  await request<void>({
    method: 'POST',
    url: API_ENDPOINTS.categories.bulkDelete,
    data: { ids },
  });
}
