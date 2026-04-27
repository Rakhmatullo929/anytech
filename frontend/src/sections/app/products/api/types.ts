export type ProductImage = {
  id: string;
  image: string;
  position: number;
};

export type ProductListItem = {
  id: string;
  tenant: string;
  name: string;
  sku: string | null;
  image: string | null;
  images: ProductImage[];
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
  images?: File[];
};

export type UpdateProductPayload = {
  id: string;
  name: string;
  sku?: string;
  images?: File[];
};
