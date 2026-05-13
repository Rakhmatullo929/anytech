export type ReportDateParams = {
  dateFrom?: string;
  dateTo?: string;
};

export type ReportTableParams = ReportDateParams & {
  page?: number;
  pageSize?: number;
  ordering?: string;
};

// ── Analytics types ────────────────────────────────────────────────────────────

export type MonthlyPoint = {
  month: string;
  count: number;
};

export type DailyPoint = {
  date: string;
  revenue: string;
  count: number;
};

export type PaymentTypeBreakdown = {
  paymentType: string;
  count: number;
  total: string;
};

export type EmployeeStats = {
  id: string;
  name: string;
  salesCount: number;
  totalRevenue: string;
  avgAmount: string;
};

export type DebtStatusBreakdown = {
  status: string;
  count: number;
  total: string;
};

export type PaymentTrendPoint = {
  date: string;
  amount: string;
};

// ── Report response types (analytics only — no table data) ────────────────────

export type CustomerReport = {
  totalCustomers: number;
  newInPeriod: number;
  registrationTrend: MonthlyPoint[];
};

export type SalesReport = {
  totalSales: number;
  totalRevenue: string;
  totalProfit: string;
  avgOrderValue: string;
  byPaymentType: PaymentTypeBreakdown[];
  revenueTrend: DailyPoint[];
};

export type EmployeeReport = {
  totalEmployees: number;
  totalSalesCount: number;
  totalRevenue: string;
  topEmployees: EmployeeStats[];
  revenueTrend: DailyPoint[];
};

export type DebtReport = {
  totalDebts: string;
  paidDebts: string;
  remainingDebts: string;
  overdueDebts: string;
  statusBreakdown: DebtStatusBreakdown[];
  paymentTrend: PaymentTrendPoint[];
};

// ── Paginated table row types ─────────────────────────────────────────────────

export type TopCustomerRow = {
  id: string;
  name: string;
  phone: string;
  totalSpent: string;
  salesCount: number;
};

export type TopDebtorRow = {
  id: string;
  name: string;
  phone: string;
  remaining: string;
};

export type TopProductRow = {
  id: string;
  name: string;
  totalQty: number;
  totalRevenue: string;
};

export type TopCategoryRow = {
  id: string;
  name: string;
  totalRevenue: string;
};

export type EmployeeStatRow = {
  id: string;
  name: string;
  salesCount: number;
  totalRevenue: string;
  avgAmount: string;
};
