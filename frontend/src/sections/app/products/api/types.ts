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
  totalQuantity: number;
  totalPurchaseAmount: string;
  averagePurchasePrice: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductDetail = Omit<ProductListItem, 'image'> & {
  images: ProductImage[];
};

export type ProductPurchaseListItem = {
  id: string;
  product: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  createdAt: string;
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

export type FetchProductPurchasesListParams = {
  page: number;
  pageSize: number;
  productId: string;
  search?: string;
  ordering?: string;
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

export type CreateProductPurchasePayload = {
  product: string;
  quantity: number;
  unitPrice: string;
};

export type UpdateProductPurchasePayload = CreateProductPurchasePayload & {
  id: string;
};
