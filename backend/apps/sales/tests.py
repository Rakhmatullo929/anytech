"""
Tests for sales app.

Covers: sale creation (cash/card/debt), auto-debt creation,
validation (missing client for debt), list/detail,
RBAC permissions, tenant isolation.
"""
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status

from apps.debts.models import Debt
from apps.sales.models import Sale, SaleItem

pytestmark = pytest.mark.django_db

LIST_URL = reverse("sale-list")


def detail_url(pk):
    return reverse("sale-detail", args=[pk])


from conftest import make_sale_payload


# ── Model tests ───────────────────────────────────────────────────────


class TestSaleModel:
    def test_str(self, tenant, client_obj, product, admin_client, admin_user):
        resp = admin_client.post(
            LIST_URL,
            make_sale_payload(product, admin_user.pk, client_id=client_obj.pk),
            format="json",
        )
        sale = Sale.objects.get(pk=resp.data["id"])
        assert "Sale" in str(sale)


# ── Cash sale ─────────────────────────────────────────────────────────


class TestCashSale:
    def test_create_cash_sale(self, admin_client, product, tenant, admin_user):
        resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["payment_type"] == "cash"
        assert Decimal(resp.data["total_amount"]) == Decimal("200.00")  # 100 * 2

    def test_sale_items_created(self, admin_client, product, admin_user):
        resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        assert SaleItem.objects.filter(sale_id=resp.data["id"]).count() == 1

    def test_no_debt_for_cash_sale(self, admin_client, product, admin_user):
        resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        assert not Debt.objects.filter(sale_id=resp.data["id"]).exists()

    def test_created_by_set_correctly(self, admin_client, product, admin_user):
        resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        assert resp.status_code == status.HTTP_201_CREATED
        sale = Sale.objects.get(pk=resp.data["id"])
        assert sale.created_by == admin_user


# ── Card sale ─────────────────────────────────────────────────────────


class TestCardSale:
    def test_create_card_sale(self, admin_client, product, admin_user):
        resp = admin_client.post(
            LIST_URL,
            make_sale_payload(product, admin_user.pk, payment_type="card"),
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["payment_type"] == "card"


# ── Debt sale (auto-creates Debt) ────────────────────────────────────


class TestDebtSale:
    def test_create_debt_sale(self, admin_client, product, client_obj, admin_user):
        resp = admin_client.post(
            LIST_URL,
            make_sale_payload(product, admin_user.pk, payment_type="debt", client_id=client_obj.pk),
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["payment_type"] == "debt"

    def test_auto_creates_debt(self, admin_client, product, client_obj, admin_user):
        resp = admin_client.post(
            LIST_URL,
            make_sale_payload(product, admin_user.pk, payment_type="debt", client_id=client_obj.pk),
            format="json",
        )
        debt = Debt.objects.get(sale_id=resp.data["id"])
        assert debt.total_amount == Decimal("200.00")
        assert debt.paid_amount == Decimal("0")
        assert debt.status == Debt.Status.ACTIVE
        assert debt.client == client_obj

    def test_debt_sale_requires_client(self, admin_client, product, admin_user):
        payload = make_sale_payload(product, admin_user.pk, payment_type="debt")
        resp = admin_client.post(LIST_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ── Validation ────────────────────────────────────────────────────────


class TestSaleValidation:
    def test_empty_items_rejected(self, admin_client, admin_user):
        resp = admin_client.post(
            LIST_URL,
            {"payment_type": "cash", "created_by_user_id": str(admin_user.pk), "items": []},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_product(self, admin_client, admin_user):
        import uuid

        resp = admin_client.post(
            LIST_URL,
            {
                "payment_type": "cash",
                "created_by_user_id": str(admin_user.pk),
                "items": [{"product": str(uuid.uuid4()), "quantity": 1}],
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_multiple_items(self, admin_client, product, product_no_sku, admin_user):
        resp = admin_client.post(
            LIST_URL,
            {
                "payment_type": "cash",
                "created_by_user_id": str(admin_user.pk),
                "items": [
                    {"product": str(product.pk), "quantity": 1, "price": "100.00"},
                    {"product": str(product_no_sku.pk), "quantity": 3, "price": "100.00"},
                ],
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert Decimal(resp.data["total_amount"]) == Decimal("400.00")
        assert SaleItem.objects.filter(sale_id=resp.data["id"]).count() == 2

    def test_insufficient_stock_rejected(self, admin_client, product, admin_user):
        resp = admin_client.post(
            LIST_URL,
            make_sale_payload(product, admin_user.pk, quantity=9999),
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_created_by_rejected(self, admin_client, product):
        resp = admin_client.post(
            LIST_URL,
            {"payment_type": "cash", "items": [{"product": str(product.pk), "quantity": 1, "price": "100.00"}]},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_wrong_tenant_user_as_created_by(self, admin_client, product, other_tenant_user):
        resp = admin_client.post(
            LIST_URL,
            make_sale_payload(product, other_tenant_user.pk),
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ── List / Detail ────────────────────────────────────────────────────


class TestSaleListDetail:
    def test_list_sales(self, admin_client, product, admin_user):
        admin_client.post(LIST_URL, make_sale_payload(product, admin_user.pk), format="json")
        resp = admin_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_detail_includes_items(self, admin_client, product, admin_user):
        create_resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        resp = admin_client.get(detail_url(create_resp.data["id"]))
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["items"]) == 1
        assert resp.data["items"][0]["product_name"] == "Test Product"

    def test_filter_by_payment_type(self, admin_client, product, admin_user):
        admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk, payment_type="cash"), format="json"
        )
        admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk, payment_type="card"), format="json"
        )
        resp = admin_client.get(LIST_URL, {"payment_type": "cash"})
        assert resp.data["count"] == 1

    def test_filter_by_created_by(self, admin_client, manager_client, product, admin_user, manager_user):
        admin_client.post(LIST_URL, make_sale_payload(product, admin_user.pk), format="json")
        admin_client.post(LIST_URL, make_sale_payload(product, manager_user.pk), format="json")
        resp = admin_client.get(LIST_URL, {"created_by": str(admin_user.pk)})
        assert resp.data["count"] == 1

    def test_pagination_returns_count_and_results(self, admin_client, product, admin_user):
        admin_client.post(LIST_URL, make_sale_payload(product, admin_user.pk), format="json")
        resp = admin_client.get(LIST_URL)
        assert "count" in resp.data
        assert "results" in resp.data


# ── Permissions ───────────────────────────────────────────────────────


class TestSalePermissions:
    def test_seller_cannot_create_sale(self, seller_client, product, admin_user):
        resp = seller_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_create(self, anon_client, product, admin_user):
        resp = anon_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_manager_cannot_create_sale(self, manager_client, product, manager_user):
        resp = manager_client.post(
            LIST_URL, make_sale_payload(product, manager_user.pk), format="json"
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ── Tenant isolation ─────────────────────────────────────────────────


class TestSaleTenantIsolation:
    def test_cannot_see_other_tenant_sales(self, admin_client, other_tenant_client, product, admin_user):
        admin_client.post(LIST_URL, make_sale_payload(product, admin_user.pk), format="json")
        resp = other_tenant_client.get(LIST_URL)
        assert resp.data["count"] == 0

    def test_cannot_use_other_tenant_product(self, other_tenant_client, product, other_tenant_user):
        resp = other_tenant_client.post(
            LIST_URL, make_sale_payload(product, other_tenant_user.pk), format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_use_other_tenant_client(self, other_tenant_client, client_obj, other_tenant, other_tenant_user):
        from apps.products.models import Product

        other_product = Product.objects.create(
            tenant=other_tenant,
            name="Other Product",
        )
        resp = other_tenant_client.post(
            LIST_URL,
            make_sale_payload(other_product, other_tenant_user.pk, payment_type="debt", client_id=client_obj.pk),
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ── Read-only (no PUT/DELETE) ─────────────────────────────────────────


class TestSaleReadOnly:
    def test_put_not_allowed(self, admin_client, product, admin_user):
        create_resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        resp = admin_client.put(
            detail_url(create_resp.data["id"]),
            {"payment_type": "card"},
            format="json",
        )
        assert resp.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_delete_not_allowed(self, admin_client, product, admin_user):
        create_resp = admin_client.post(
            LIST_URL, make_sale_payload(product, admin_user.pk), format="json"
        )
        resp = admin_client.delete(detail_url(create_resp.data["id"]))
        assert resp.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
