import { request, API_ENDPOINTS } from 'src/utils/axios';
import type { Pagination } from 'src/hooks/api';

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

function dateParams(p: ReportDateParams) {
  return {
    ...(p.dateFrom ? { dateFrom: p.dateFrom } : {}),
    ...(p.dateTo ? { dateTo: p.dateTo } : {}),
  };
}

function tableParams(p: ReportTableParams) {
  return {
    ...dateParams(p),
    ...(p.page ? { page: p.page } : {}),
    ...(p.pageSize ? { pageSize: p.pageSize } : {}),
    ...(p.ordering ? { ordering: p.ordering } : {}),
  };
}

// Analytics

export const fetchCustomerReport = (p: ReportDateParams) =>
  request<CustomerReport>({ method: 'GET', url: API_ENDPOINTS.reports.customers, params: dateParams(p) });

export const fetchSalesReport = (p: ReportDateParams) =>
  request<SalesReport>({ method: 'GET', url: API_ENDPOINTS.reports.sales, params: dateParams(p) });

export const fetchEmployeeReport = (p: ReportDateParams) =>
  request<EmployeeReport>({ method: 'GET', url: API_ENDPOINTS.reports.employees, params: dateParams(p) });

export const fetchDebtReport = (p: ReportDateParams) =>
  request<DebtReport>({ method: 'GET', url: API_ENDPOINTS.reports.debts, params: dateParams(p) });

// Paginated tables

export const fetchTopCustomers = (p: ReportTableParams) =>
  request<Pagination<TopCustomerRow>>({ method: 'GET', url: API_ENDPOINTS.reports.topCustomers, params: tableParams(p) });

export const fetchTopDebtors = (p: ReportTableParams) =>
  request<Pagination<TopDebtorRow>>({ method: 'GET', url: API_ENDPOINTS.reports.topDebtors, params: tableParams(p) });

export const fetchTopProducts = (p: ReportTableParams) =>
  request<Pagination<TopProductRow>>({ method: 'GET', url: API_ENDPOINTS.reports.topProducts, params: tableParams(p) });

export const fetchTopCategories = (p: ReportTableParams) =>
  request<Pagination<TopCategoryRow>>({ method: 'GET', url: API_ENDPOINTS.reports.topCategories, params: tableParams(p) });

export const fetchEmployeeStats = (p: ReportTableParams) =>
  request<Pagination<EmployeeStatRow>>({ method: 'GET', url: API_ENDPOINTS.reports.employeeStats, params: tableParams(p) });
