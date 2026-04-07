/** Client row from `GET /api/v1/clients/` (camelCase after axios transform). */
export type ClientListItem = {
  id: string;
  tenant: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type FetchClientsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  ordering?: string;
};

export type CreateClientPayload = {
  name: string;
  phone: string;
};

export type UpdateClientPayload = {
  id: string;
  name: string;
  phone: string;
};

export type BulkCreateClientsResult = {
  created: number;
  results: ClientListItem[];
};

export type ClientSaleItem = {
  id: string;
  productName: string;
  quantity: number;
  price: string;
};

export type ClientSaleDebt = {
  totalAmount: string;
  paidAmount: string;
  remaining: string;
  status: string;
};

export type ClientSale = {
  id: string;
  totalAmount: string;
  paymentType: 'cash' | 'card' | 'debt';
  createdAt: string;
  items: ClientSaleItem[];
  debt: ClientSaleDebt | null;
};

/** Client detail from `GET /api/v1/clients/{id}/` (camelCase after axios transform). */
export type ClientDetail = ClientListItem & {
  sales: ClientSale[];
  totalDebt: string;
};
