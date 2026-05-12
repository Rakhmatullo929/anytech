import { useMemo } from 'react';
import { useFetchList, useFetchOne } from 'src/hooks/api';

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

export function useTopCustomersQuery(params: ReportTableParams) {
  const queryKey = useMemo(
    () => ['reports', 'top-customers', params] as const,
    [params]
  );
  return useFetchList<TopCustomerRow>(queryKey, () => fetchTopCustomers(params), {
    placeholderData: (prev) => prev,
  });
}

export function useTopDebtorsQuery(params: ReportTableParams) {
  const queryKey = useMemo(
    () => ['reports', 'top-debtors', params] as const,
    [params]
  );
  return useFetchList<TopDebtorRow>(queryKey, () => fetchTopDebtors(params), {
    placeholderData: (prev) => prev,
  });
}

export function useTopProductsQuery(params: ReportTableParams) {
  const queryKey = useMemo(
    () => ['reports', 'top-products', params] as const,
    [params]
  );
  return useFetchList<TopProductRow>(queryKey, () => fetchTopProducts(params), {
    placeholderData: (prev) => prev,
  });
}

export function useTopCategoriesQuery(params: ReportTableParams) {
  const queryKey = useMemo(
    () => ['reports', 'top-categories', params] as const,
    [params]
  );
  return useFetchList<TopCategoryRow>(queryKey, () => fetchTopCategories(params), {
    placeholderData: (prev) => prev,
  });
}

export function useEmployeeStatsQuery(params: ReportTableParams) {
  const queryKey = useMemo(
    () => ['reports', 'employee-stats', params] as const,
    [params]
  );
  return useFetchList<EmployeeStatRow>(queryKey, () => fetchEmployeeStats(params), {
    placeholderData: (prev) => prev,
  });
}
