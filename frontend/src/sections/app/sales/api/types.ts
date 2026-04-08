export type SalePaymentType = 'cash' | 'card' | 'debt';

export type SaleListItem = {
  id: string;
  client: string | null;
  clientName: string | null;
  totalAmount: string;
  paymentType: SalePaymentType;
  createdAt: string;
};

export type SaleDetailItem = {
  id: string;
  product: string;
  productName: string;
  quantity: number;
  price: string;
};

export type SaleDetail = SaleListItem & {
  items: SaleDetailItem[];
};

export type FetchSalesListParams = {
  page: number;
  pageSize: number;
  ordering?: string;
  paymentType?: SalePaymentType;
};
