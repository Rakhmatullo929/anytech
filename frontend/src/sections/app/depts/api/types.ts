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
  clientIds?: string;
  dateFrom?: string;
  dateTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  amountFrom?: string;
  amountTo?: string;
};

export type ExportDebtsParams = {
  ordering?: string;
  status?: DebtStatus;
  clientIds?: string;
  dateFrom?: string;
  dateTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  amountFrom?: string;
  amountTo?: string;
};

export type PayDebtPayload = {
  amount: string;
  paymentMethod: DebtPaymentMethod;
};

export type DebtPaymentHistoryItem = {
  id: string;
  debtId: string;
  customerId: string | null;
  customerName: string | null;
  amount: string;
  paymentMethod: DebtPaymentMethod;
  createdAt: string;
  cashierId: string | null;
  cashierName: string | null;
};

export type FetchDebtPaymentsParams = {
  page: number;
  pageSize: number;
  ordering?: string;
  customerId?: string;
  paymentMethod?: DebtPaymentMethod | '';
  cashierIds?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ExportDebtPaymentsParams = Omit<FetchDebtPaymentsParams, 'page' | 'pageSize'>;
