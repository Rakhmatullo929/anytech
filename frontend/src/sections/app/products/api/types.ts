export type ProductListItem = {
  id: string;
  tenant: string;
  name: string;
  sku: string | null;
  purchasePrice: string;
  salePrice: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = ProductListItem;

export type FetchProductsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type CreateProductPayload = {
  name: string;
  sku?: string;
  purchasePrice: string;
  salePrice: string;
  stock: number;
};

export type UpdateProductPayload = {
  id: string;
  name: string;
  sku?: string;
  purchasePrice: string;
  salePrice: string;
};
