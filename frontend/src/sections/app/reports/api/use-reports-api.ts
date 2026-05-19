import { useMemo } from 'react';
import { useFetchList, useFetchOne } from 'src/hooks/api';
import type { Pagination } from 'src/hooks/api';

import {
  fetchCustomerReport,
  fetchDebtReport,
  fetchEmployeeReport,
  fetchEmployeeStats,
  fetchSalesReport,
  fetchTopCategories,
  fetchTopCustomers,
  fetchTopDebtors,
  fetchTopProducts,
} from './reports-requests';
import type {
  CustomerReport,
  DebtReport,
  EmployeeReport,
  EmployeeStatRow,
  ReportDateParams,
  ReportTableParams,
  SalesReport,
  TopCategoryRow,
  TopCustomerRow,
  TopDebtorRow,
  TopProductRow,
} from './types';

// ── Analytics hooks ────────────────────────────────────────────────────────────

function makeReportQuery<T>(key: string, fetcher: (p: ReportDateParams) => Promise<T>) {
  return function useReportQuery(params: ReportDateParams) {
    const queryKey = useMemo(
      () => ['reports', key, { dateFrom: params.dateFrom ?? '', dateTo: params.dateTo ?? '' }] as const,
      [params.dateFrom, params.dateTo]
    );
    return useFetchOne<T>(queryKey, () => fetcher(params), {
      placeholderData: (prev) => prev,
    });
  };
}

export const useCustomerReportQuery = makeReportQuery<CustomerReport>('customers', fetchCustomerReport);
export const useSalesReportQuery = makeReportQuery<SalesReport>('sales', fetchSalesReport);
export const useEmployeeReportQuery = makeReportQuery<EmployeeReport>('employees', fetchEmployeeReport);
export const useDebtReportQuery = makeReportQuery<DebtReport>('debts', fetchDebtReport);

// ── Paginated table hooks ─────────────────────────────────────────────────────

function makeTableQuery<T extends { id: string | number }>(
  key: string,
  fetcher: (p: ReportTableParams) => Promise<Pagination<T>>
) {
  return function useTableQuery(params: ReportTableParams) {
    const { dateFrom, dateTo, page, pageSize, ordering } = params;
    const queryKey = useMemo(
      () => ['reports', key, { dateFrom, dateTo, page, pageSize, ordering }] as const,
      [dateFrom, dateTo, page, pageSize, ordering]
    );
    return useFetchList<T>(queryKey, () => fetcher(params), {
      placeholderData: (prev) => prev,
    });
  };
}

export const useTopCustomersQuery = makeTableQuery<TopCustomerRow>('top-customers', fetchTopCustomers);
export const useTopDebtorsQuery = makeTableQuery<TopDebtorRow>('top-debtors', fetchTopDebtors);
export const useTopProductsQuery = makeTableQuery<TopProductRow>('top-products', fetchTopProducts);
export const useTopCategoriesQuery = makeTableQuery<TopCategoryRow>('top-categories', fetchTopCategories);
export const useEmployeeStatsQuery = makeTableQuery<EmployeeStatRow>('employee-stats', fetchEmployeeStats);
