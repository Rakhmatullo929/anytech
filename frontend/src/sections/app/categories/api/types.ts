export type CategoryListItem = {
  id: string;
  tenant: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FetchCategoriesListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type CreateCategoryPayload = {
  name: string;
};

export type UpdateCategoryPayload = {
  id: string;
  name: string;
};
