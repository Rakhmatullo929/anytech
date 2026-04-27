export type ProductImage = {
  id: string;
  image: string;
  position: number;
};

export type ProductCategory = {
  id: string;
  name: string;
} | null;

export type ProductListItem = {
  id: string;
  tenant: string;
  category: ProductCategory;
  name: string;
  sku: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = Omit<ProductListItem, 'image'> & {
  images: ProductImage[];
};

export type CategoryListItem = {
  id: string;
  tenant: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type FetchProductsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
  categoryId?: string;
};

export type CreateProductPayload = {
  name: string;
  sku?: string;
  category?: string;
  images?: File[];
};

export type UpdateProductPayload = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  images?: File[];
};
