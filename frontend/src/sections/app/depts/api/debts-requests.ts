import type { Pagination } from 'src/hooks/api';
import { request, API_ENDPOINTS } from 'src/utils/axios';

import type {
  CustomerDebtStats,
  CustomerDebtSummary,
  DebtDetail,
  DebtListItem,
  DebtPaymentHistoryItem,
  ExportCustomerDebtSummaryParams,
  ExportDebtPaymentsParams,
  ExportDebtsParams,
  FetchCustomerDebtSummaryParams,
  FetchDebtPaymentsParams,
  FetchDebtsListParams,
  PayDebtPayload,
} from './types';

export async function fetchDebtsList(params: FetchDebtsListParams): Promise<Pagination<DebtListItem>> {
  return request<Pagination<DebtListItem>>({
    method: 'GET',
    url: API_ENDPOINTS.debts.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ordering: params.ordering ?? '-created_at',
      ...(params.status ? { status: params.status } : {}),
      ...(params.clientIds ? { client_ids: params.clientIds } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
      ...(params.deadlineFrom ? { deadline_from: params.deadlineFrom } : {}),
      ...(params.deadlineTo ? { deadline_to: params.deadlineTo } : {}),
      ...(params.amountFrom ? { amount_from: params.amountFrom } : {}),
      ...(params.amountTo ? { amount_to: params.amountTo } : {}),
    },
  });
}

export async function exportDebtsExcel(params: ExportDebtsParams): Promise<void> {
  const response = await request<Blob>({
    method: 'GET',
    url: API_ENDPOINTS.debts.exportExcel,
    responseType: 'blob',
    params: {
      ordering: params.ordering ?? '-created_at',
      ...(params.status ? { status: params.status } : {}),
      ...(params.clientIds ? { client_ids: params.clientIds } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
      ...(params.deadlineFrom ? { deadline_from: params.deadlineFrom } : {}),
      ...(params.deadlineTo ? { deadline_to: params.deadlineTo } : {}),
      ...(params.amountFrom ? { amount_from: params.amountFrom } : {}),
      ...(params.amountTo ? { amount_to: params.amountTo } : {}),
    },
  });
  const url = window.URL.createObjectURL(response as unknown as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'debts_export.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function fetchDebtDetail(id: string): Promise<DebtDetail> {
  return request<DebtDetail>({
    method: 'GET',
    url: API_ENDPOINTS.debts.detail(id),
  });
}

export async function payDebt(id: string, payload: PayDebtPayload): Promise<DebtDetail> {
  return request<DebtDetail>({
    method: 'POST',
    url: API_ENDPOINTS.debts.pay(id),
    data: payload,
  });
}

export async function fetchDebtPaymentsList(
  params: FetchDebtPaymentsParams
): Promise<Pagination<DebtPaymentHistoryItem>> {
  return request<Pagination<DebtPaymentHistoryItem>>({
    method: 'GET',
    url: API_ENDPOINTS.debtPayments.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ordering: params.ordering ?? '-created_at',
      ...(params.customerId ? { customer_id: params.customerId } : {}),
      ...(params.paymentMethod ? { payment_method: params.paymentMethod } : {}),
      ...(params.cashierIds ? { cashier_ids: params.cashierIds } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
    },
  });
}

export async function exportDebtPaymentsExcel(params: ExportDebtPaymentsParams): Promise<void> {
  const response = await request<Blob>({
    method: 'GET',
    url: API_ENDPOINTS.debtPayments.exportExcel,
    responseType: 'blob',
    params: {
      ordering: params.ordering ?? '-created_at',
      ...(params.customerId ? { customer_id: params.customerId } : {}),
      ...(params.paymentMethod ? { payment_method: params.paymentMethod } : {}),
      ...(params.cashierIds ? { cashier_ids: params.cashierIds } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
    },
  });
  const url = window.URL.createObjectURL(response as unknown as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'debt_payments_export.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function fetchCustomerDebtSummary(
  params: FetchCustomerDebtSummaryParams
): Promise<Pagination<CustomerDebtSummary>> {
  return request<Pagination<CustomerDebtSummary>>({
    method: 'GET',
    url: API_ENDPOINTS.customerDebtSummary.list,
    params: {
      page: params.page,
      pageSize: params.pageSize,
      ordering: params.ordering ?? '-last_debt_date',
      ...(params.search ? { search: params.search } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
      ...(params.amountFrom ? { amount_from: params.amountFrom } : {}),
      ...(params.amountTo ? { amount_to: params.amountTo } : {}),
    },
  });
}

export async function fetchCustomerDebtStats(): Promise<CustomerDebtStats> {
  return request<CustomerDebtStats>({
    method: 'GET',
    url: API_ENDPOINTS.customerDebtSummary.stats,
  });
}

export async function exportCustomerDebtSummaryExcel(
  params: ExportCustomerDebtSummaryParams
): Promise<void> {
  const response = await request<Blob>({
    method: 'GET',
    url: API_ENDPOINTS.customerDebtSummary.exportExcel,
    responseType: 'blob',
    params: {
      ordering: params.ordering ?? '-last_debt_date',
      ...(params.search ? { search: params.search } : {}),
      ...(params.dateFrom ? { date_from: params.dateFrom } : {}),
      ...(params.dateTo ? { date_to: params.dateTo } : {}),
      ...(params.amountFrom ? { amount_from: params.amountFrom } : {}),
      ...(params.amountTo ? { amount_to: params.amountTo } : {}),
    },
  });
  const url = window.URL.createObjectURL(response as unknown as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'customer_debts_export.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
}
