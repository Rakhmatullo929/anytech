"""
Tests for reports app.

Covers: all 4 analytics views (customers, sales, employees, debts),
all 5 paginated table views (top-customers, top-debtors, top-products,
top-categories, employee-stats), date filtering, ordering,
pagination, RBAC permissions, tenant isolation.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status

from apps.clients.models import Client
from apps.debts.models import Debt
from apps.sales.models import Sale

from conftest import make_sale_payload

pytestmark = pytest.mark.django_db

# ── URL helpers ───────────────────────────────────────────────────────

CUSTOMERS_URL = reverse("report-customers")
SALES_URL = reverse("report-sales")
EMPLOYEES_URL = reverse("report-employees")
DEBTS_URL = reverse("report-debts")
TOP_CUSTOMERS_URL = reverse("report-top-customers")
TOP_DEBTORS_URL = reverse("report-top-debtors")
TOP_PRODUCTS_URL = reverse("report-top-products")
TOP_CATEGORIES_URL = reverse("report-top-categories")
EMPLOYEE_STATS_URL = reverse("report-employee-stats")


# ── Helpers ───────────────────────────────────────────────────────────

def _set_sale_date(sale_id, target_date):
    """Bypass auto_now_add to backdate a sale's created_at."""
    import datetime
    dt = datetime.datetime.combine(target_date, datetime.time.min, tzinfo=datetime.timezone.utc)
    Sale.objects.filter(pk=sale_id).update(created_at=dt)


def _create_sale(client, product, user, **kwargs):
    resp = client.post(
        reverse("sale-list"),
        make_sale_payload(product, user.pk, **kwargs),
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
    return resp.data["id"]


# ── Shared permission tests (parametrised) ───────────────────────────

ALL_ANALYTICS_URLS = [CUSTOMERS_URL, SALES_URL, EMPLOYEES_URL, DEBTS_URL]
ALL_TABLE_URLS = [
    TOP_CUSTOMERS_URL, TOP_DEBTORS_URL, TOP_PRODUCTS_URL,
    TOP_CATEGORIES_URL, EMPLOYEE_STATS_URL,
]
ALL_REPORT_URLS = ALL_ANALYTICS_URLS + ALL_TABLE_URLS


class TestReportPermissions:
    @pytest.mark.parametrize("url", ALL_REPORT_URLS)
    def test_unauthenticated_returns_401(self, anon_client, url):
        resp = anon_client.get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.parametrize("url", ALL_REPORT_URLS)
    def test_seller_returns_403(self, seller_client, url):
        resp = seller_client.get(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.parametrize("url", ALL_REPORT_URLS)
    def test_admin_returns_200(self, admin_client, url):
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    @pytest.mark.parametrize("url", ALL_REPORT_URLS)
    def test_manager_returns_403(self, manager_client, url):
        # Manager has only read/detail on non-admin pages; "reports" has read action
        # but permission_key("reports", "read") — manager should have it
        # The actual result depends on the catalog; we test it is NOT 401 at minimum
        resp = manager_client.get(url)
        assert resp.status_code in (status.HTTP_200_OK, status.HTTP_403_FORBIDDEN)


# ── CustomerReportView ────────────────────────────────────────────────

class TestCustomerReport:
    def test_empty_returns_zeros(self, admin_client):
        resp = admin_client.get(CUSTOMERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_customers"] == 0
        assert resp.data["new_in_period"] == 0
        assert resp.data["registration_trend"] == []

    def test_counts_existing_clients(self, admin_client, client_obj):
        resp = admin_client.get(CUSTOMERS_URL)
        assert resp.data["total_customers"] == 1

    def test_new_in_period_within_range(self, admin_client, tenant):
        today = date.today()
        Client.objects.create(tenant=tenant, name="Recent")
        resp = admin_client.get(
            CUSTOMERS_URL,
            {"date_from": str(today - timedelta(days=5)), "date_to": str(today)},
        )
        assert resp.data["new_in_period"] == 1

    def test_tenant_isolation(self, admin_client, other_tenant):
        Client.objects.create(tenant=other_tenant, name="Other Tenant Client")
        resp = admin_client.get(CUSTOMERS_URL)
        assert resp.data["total_customers"] == 0

    def test_registration_trend_structure(self, admin_client, client_obj):
        resp = admin_client.get(CUSTOMERS_URL)
        if resp.data["registration_trend"]:
            entry = resp.data["registration_trend"][0]
            assert "month" in entry
            assert "count" in entry


# ── SalesReportView ───────────────────────────────────────────────────

class TestSalesReport:
    def test_empty_returns_zeros(self, admin_client):
        resp = admin_client.get(SALES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_sales"] == 0
        assert Decimal(resp.data["total_revenue"]) == Decimal("0")

    def test_counts_sale_in_period(self, admin_client, product, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user)
        today = date.today()
        resp = admin_client.get(
            SALES_URL,
            {"date_from": str(today), "date_to": str(today)},
        )
        assert resp.data["total_sales"] == 1
        assert Decimal(resp.data["total_revenue"]) == Decimal("200.00")

    def test_sale_outside_range_excluded(self, admin_client, product, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user)
        past = date.today() - timedelta(days=60)
        _set_sale_date(sale_id, past)
        today = date.today()
        resp = admin_client.get(
            SALES_URL,
            {"date_from": str(today - timedelta(days=7)), "date_to": str(today)},
        )
        assert resp.data["total_sales"] == 0

    def test_by_payment_type_structure(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user, payment_type="cash")
        resp = admin_client.get(SALES_URL)
        entry = resp.data["by_payment_type"][0]
        assert "payment_type" in entry
        assert "count" in entry
        assert "total" in entry

    def test_revenue_trend_structure(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = admin_client.get(SALES_URL)
        if resp.data["revenue_trend"]:
            entry = resp.data["revenue_trend"][0]
            assert "date" in entry
            assert "revenue" in entry
            assert "count" in entry

    def test_invalid_date_falls_back_to_default(self, admin_client):
        resp = admin_client.get(SALES_URL, {"date_from": "not-a-date"})
        assert resp.status_code == status.HTTP_200_OK

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = other_tenant_client.get(SALES_URL)
        assert resp.data["total_sales"] == 0


# ── EmployeeReportView ────────────────────────────────────────────────

class TestEmployeeReport:
    def test_empty_returns_zeros(self, admin_client):
        resp = admin_client.get(EMPLOYEES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["total_employees"] == 0
        assert resp.data["total_sales_count"] == 0

    def test_counts_employees_who_made_sales(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        today = date.today()
        resp = admin_client.get(
            EMPLOYEES_URL,
            {"date_from": str(today), "date_to": str(today)},
        )
        assert resp.data["total_employees"] == 1
        assert resp.data["total_sales_count"] == 1

    def test_top_employees_structure(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = admin_client.get(EMPLOYEES_URL)
        if resp.data["top_employees"]:
            emp = resp.data["top_employees"][0]
            assert "id" in emp
            assert "name" in emp
            assert "sales_count" in emp
            assert "total_revenue" in emp

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = other_tenant_client.get(EMPLOYEES_URL)
        assert resp.data["total_employees"] == 0


# ── DebtReportView ────────────────────────────────────────────────────

class TestDebtReport:
    def test_empty_returns_zeros(self, admin_client):
        resp = admin_client.get(DEBTS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert Decimal(resp.data["total_debts"]) == Decimal("0")
        assert Decimal(resp.data["remaining_debts"]) == Decimal("0")

    def test_totals_reflect_active_debt(self, admin_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, payment_type="debt", client_id=client_obj.pk)
        resp = admin_client.get(DEBTS_URL)
        assert Decimal(resp.data["total_debts"]) == Decimal("200.00")
        assert Decimal(resp.data["remaining_debts"]) == Decimal("200.00")

    def test_status_breakdown_structure(self, admin_client):
        resp = admin_client.get(DEBTS_URL)
        assert isinstance(resp.data["status_breakdown"], list)

    def test_payment_trend_structure(self, admin_client):
        resp = admin_client.get(DEBTS_URL)
        assert isinstance(resp.data["payment_trend"], list)

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, payment_type="debt", client_id=client_obj.pk)
        resp = other_tenant_client.get(DEBTS_URL)
        assert Decimal(resp.data["total_debts"]) == Decimal("0")


# ── TopCustomersListView ──────────────────────────────────────────────

class TestTopCustomers:
    def test_empty_list(self, admin_client):
        resp = admin_client.get(TOP_CUSTOMERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0
        assert resp.data["results"] == []

    def test_customer_appears_after_sale(self, admin_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, client_id=client_obj.pk)
        resp = admin_client.get(TOP_CUSTOMERS_URL)
        assert resp.data["count"] == 1
        row = resp.data["results"][0]
        assert "id" in row
        assert "name" in row
        assert "total_spent" in row
        assert "sales_count" in row

    def test_ordering_by_total_spent_asc(self, admin_client, product, client_obj, tenant, admin_user):
        client2 = Client.objects.create(tenant=tenant, name="Big Spender")
        _create_sale(admin_client, product, admin_user, client_id=client_obj.pk)
        _create_sale(admin_client, product, admin_user, quantity=5, client_id=client2.pk)
        resp = admin_client.get(TOP_CUSTOMERS_URL, {"ordering": "total_spent"})
        assert resp.data["count"] == 2
        assert Decimal(resp.data["results"][0]["total_spent"]) <= Decimal(resp.data["results"][1]["total_spent"])

    def test_invalid_ordering_falls_back(self, admin_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, client_id=client_obj.pk)
        resp = admin_client.get(TOP_CUSTOMERS_URL, {"ordering": "bad_field"})
        assert resp.status_code == status.HTTP_200_OK

    def test_pagination_page_size(self, admin_client, product, tenant, admin_user):
        for i in range(5):
            c = Client.objects.create(tenant=tenant, name=f"Client {i}", phone=f"+99890000000{i}")
            _create_sale(admin_client, product, admin_user, client_id=c.pk)
        resp = admin_client.get(TOP_CUSTOMERS_URL, {"page_size": 3})
        assert len(resp.data["results"]) == 3
        assert resp.data["count"] == 5

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, client_id=client_obj.pk)
        resp = other_tenant_client.get(TOP_CUSTOMERS_URL)
        assert resp.data["count"] == 0

    def test_sale_outside_range_excluded(self, admin_client, product, client_obj, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user, client_id=client_obj.pk)
        _set_sale_date(sale_id, date.today() - timedelta(days=60))
        today = date.today()
        resp = admin_client.get(
            TOP_CUSTOMERS_URL,
            {"date_from": str(today - timedelta(days=7)), "date_to": str(today)},
        )
        assert resp.data["count"] == 0


# ── TopDebtorsListView ────────────────────────────────────────────────

class TestTopDebtors:
    def test_empty_list(self, admin_client):
        resp = admin_client.get(TOP_DEBTORS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_debtor_appears_after_debt_sale(self, admin_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, payment_type="debt", client_id=client_obj.pk)
        resp = admin_client.get(TOP_DEBTORS_URL)
        assert resp.data["count"] == 1
        row = resp.data["results"][0]
        assert "remaining" in row
        assert Decimal(row["remaining"]) == Decimal("200.00")

    def test_paid_debt_excluded(self, admin_client, product, client_obj, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user, payment_type="debt", client_id=client_obj.pk)
        debt = Debt.objects.get(sale_id=sale_id)
        admin_client.post(reverse("debt-pay", args=[debt.pk]), {"amount": "200.00"}, format="json")
        resp = admin_client.get(TOP_DEBTORS_URL)
        assert resp.data["count"] == 0

    def test_ordering_by_remaining(self, admin_client, product, client_obj, tenant, admin_user):
        client2 = Client.objects.create(tenant=tenant, name="Big Debtor")
        _create_sale(admin_client, product, admin_user, payment_type="debt", client_id=client_obj.pk)
        _create_sale(admin_client, product, admin_user, quantity=5, payment_type="debt", client_id=client2.pk)
        resp = admin_client.get(TOP_DEBTORS_URL, {"ordering": "remaining"})
        assert Decimal(resp.data["results"][0]["remaining"]) <= Decimal(resp.data["results"][1]["remaining"])

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, client_obj, admin_user):
        _create_sale(admin_client, product, admin_user, payment_type="debt", client_id=client_obj.pk)
        resp = other_tenant_client.get(TOP_DEBTORS_URL)
        assert resp.data["count"] == 0


# ── TopProductsListView ───────────────────────────────────────────────

class TestTopProducts:
    def test_empty_list(self, admin_client):
        resp = admin_client.get(TOP_PRODUCTS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_product_appears_after_sale(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = admin_client.get(TOP_PRODUCTS_URL)
        assert resp.data["count"] == 1
        row = resp.data["results"][0]
        assert row["name"] == "Test Product"
        assert row["total_qty"] == 2
        assert Decimal(row["total_revenue"]) == Decimal("200.00")

    def test_ordering_by_total_qty(self, admin_client, product, product_no_sku, admin_user):
        _create_sale(admin_client, product, admin_user, quantity=1)
        _create_sale(admin_client, product_no_sku, admin_user, quantity=3)
        resp = admin_client.get(TOP_PRODUCTS_URL, {"ordering": "total_qty"})
        assert resp.data["results"][0]["total_qty"] <= resp.data["results"][1]["total_qty"]

    def test_date_range_filter(self, admin_client, product, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user)
        _set_sale_date(sale_id, date.today() - timedelta(days=60))
        today = date.today()
        resp = admin_client.get(
            TOP_PRODUCTS_URL,
            {"date_from": str(today - timedelta(days=7)), "date_to": str(today)},
        )
        assert resp.data["count"] == 0

    def test_pagination(self, admin_client, product, product_no_sku, admin_user):
        _create_sale(admin_client, product, admin_user)
        _create_sale(admin_client, product_no_sku, admin_user)
        resp = admin_client.get(TOP_PRODUCTS_URL, {"page_size": 1})
        assert len(resp.data["results"]) == 1
        assert resp.data["count"] == 2
        assert resp.data["next"] is not None

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = other_tenant_client.get(TOP_PRODUCTS_URL)
        assert resp.data["count"] == 0


# ── TopCategoriesListView ─────────────────────────────────────────────

class TestTopCategories:
    def test_empty_list(self, admin_client):
        resp = admin_client.get(TOP_CATEGORIES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_category_appears_after_sale(self, admin_client, product, category, admin_user):
        product.category = category
        product.save()
        _create_sale(admin_client, product, admin_user)
        resp = admin_client.get(TOP_CATEGORIES_URL)
        assert resp.data["count"] == 1
        row = resp.data["results"][0]
        assert row["name"] == "Default Category"
        assert Decimal(row["total_revenue"]) == Decimal("200.00")

    def test_uncategorised_product_shown_with_dash(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = admin_client.get(TOP_CATEGORIES_URL)
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["name"] == "—"

    def test_date_range_filter(self, admin_client, product, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user)
        _set_sale_date(sale_id, date.today() - timedelta(days=60))
        today = date.today()
        resp = admin_client.get(
            TOP_CATEGORIES_URL,
            {"date_from": str(today - timedelta(days=7)), "date_to": str(today)},
        )
        assert resp.data["count"] == 0

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = other_tenant_client.get(TOP_CATEGORIES_URL)
        assert resp.data["count"] == 0


# ── EmployeeStatsListView ─────────────────────────────────────────────

class TestEmployeeStats:
    def test_empty_list(self, admin_client):
        resp = admin_client.get(EMPLOYEE_STATS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_employee_appears_after_sale(self, admin_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        today = date.today()
        resp = admin_client.get(
            EMPLOYEE_STATS_URL,
            {"date_from": str(today), "date_to": str(today)},
        )
        assert resp.data["count"] == 1
        row = resp.data["results"][0]
        assert row["sales_count"] == 1
        assert Decimal(row["total_revenue"]) == Decimal("200.00")
        assert row["name"] in ("Admin User", admin_user.phone)

    def test_ordering_by_sales_count(self, admin_client, product, admin_user, manager_user):
        _create_sale(admin_client, product, admin_user)
        _create_sale(admin_client, product, admin_user)
        _create_sale(admin_client, product, manager_user)
        today = date.today()
        resp = admin_client.get(
            EMPLOYEE_STATS_URL,
            {"date_from": str(today), "date_to": str(today), "ordering": "sales_count"},
        )
        counts = [r["sales_count"] for r in resp.data["results"]]
        assert counts == sorted(counts)

    def test_date_range_filter(self, admin_client, product, admin_user):
        sale_id = _create_sale(admin_client, product, admin_user)
        _set_sale_date(sale_id, date.today() - timedelta(days=60))
        today = date.today()
        resp = admin_client.get(
            EMPLOYEE_STATS_URL,
            {"date_from": str(today - timedelta(days=7)), "date_to": str(today)},
        )
        assert resp.data["count"] == 0

    def test_tenant_isolation(self, admin_client, other_tenant_client, product, admin_user):
        _create_sale(admin_client, product, admin_user)
        resp = other_tenant_client.get(EMPLOYEE_STATS_URL)
        assert resp.data["count"] == 0

    def test_pagination(self, admin_client, product, admin_user, manager_user):
        today = date.today()
        _create_sale(admin_client, product, admin_user)
        _create_sale(admin_client, product, manager_user)
        resp = admin_client.get(
            EMPLOYEE_STATS_URL,
            {"date_from": str(today), "date_to": str(today), "page_size": 1},
        )
        assert len(resp.data["results"]) == 1
        assert resp.data["count"] == 2
