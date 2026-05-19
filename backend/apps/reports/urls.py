from django.urls import path

from .views import (
    CustomerReportView,
    DebtReportView,
    EmployeeReportView,
    EmployeeStatsListView,
    SalesReportView,
    TopCategoriesListView,
    TopCustomersListView,
    TopDebtorsListView,
    TopProductsListView,
)

urlpatterns = [
    # Analytics (charts + stat cards)
    path("customers/", CustomerReportView.as_view(), name="report-customers"),
    path("sales/", SalesReportView.as_view(), name="report-sales"),
    path("employees/", EmployeeReportView.as_view(), name="report-employees"),
    path("debts/", DebtReportView.as_view(), name="report-debts"),
    # Paginated tables
    path("top-customers/", TopCustomersListView.as_view(), name="report-top-customers"),
    path("top-debtors/", TopDebtorsListView.as_view(), name="report-top-debtors"),
    path("top-products/", TopProductsListView.as_view(), name="report-top-products"),
    path("top-categories/", TopCategoriesListView.as_view(), name="report-top-categories"),
    path("employee-stats/", EmployeeStatsListView.as_view(), name="report-employee-stats"),
]
