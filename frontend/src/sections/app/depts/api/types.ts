export type DebtStatus = 'active' | 'closed';

export type DebtListItem = {
  id: string;
  client: string;
  clientName: string;
  sale: string;
  totalAmount: string;
  paidAmount: string;
  remaining: string;
  status: DebtStatus;
  createdAt: string;
};

export type FetchDebtsListParams = {
  page: number;
  pageSize: number;
  ordering?: string;
  status?: DebtStatus;
};
