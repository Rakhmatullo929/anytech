export type DebtStatus = 'active' | 'closed';

export type DebtPaymentMethod = 'cash' | 'card' | 'transfer';

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
  deadline: string | null;
};

export type DebtPayment = {
  id: string;
  amount: string;
  paymentMethod: DebtPaymentMethod;
  createdAt: string;
};

export type DebtDetail = DebtListItem & {
  payments: DebtPayment[];
};

export type FetchDebtsListParams = {
  page: number;
  pageSize: number;
  ordering?: string;
  status?: DebtStatus;
  clientId?: string;
};

export type PayDebtPayload = {
  amount: string;
  paymentMethod: DebtPaymentMethod;
};
