"""
Tests for debts app — Stage 6.

Covers: debt list/detail, payment creation, auto-close on full payment,
partial payments, validation (overpay, closed debt, zero amount),
RBAC permissions, tenant isolation.
"""
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status

from conftest import make_sale_payload
from debts.models import Debt, Payment

pytestmark = pytest.mark.django_db

LIST_URL = reverse("debt-list")


def detail_url(pk):
    return reverse("debt-detail", args=[pk])


def pay_url(pk):
    return reverse("debt-pay", args=[pk])


# ── Fixtures ──────────────────────────────────────────────────────────


@pytest.fixture
def debt_sale(tenant, client_obj, product, admin_client):
    resp = admin_client.post(
        reverse("sale-list"),
        make_sale_payload(product, payment_type="debt", client_id=client_obj.pk),
        format="json",
    )
    return Debt.objects.get(sale_id=resp.data["id"])


# ── Model tests ───────────────────────────────────────────────────────


class TestDebtModel:
    def test_remaining_property(self, debt_sale):
        assert debt_sale.remaining == Decimal("200.00")

    def test_str(self, debt_sale):
        assert "Debt" in str(debt_sale)

    def test_default_status_active(self, debt_sale):
        assert debt_sale.status == Debt.Status.ACTIVE

    def test_default_paid_amount_zero(self, debt_sale):
        assert debt_sale.paid_amount == Decimal("0")


class TestPaymentModel:
    def test_str(self, debt_sale):
        payment = Payment.objects.create(debt=debt_sale, amount=Decimal("50.00"))
        assert "Payment" in str(payment)
        assert "50.00" in str(payment)


# ── List / Detail ────────────────────────────────────────────────────


class TestDebtList:
    def test_list_debts(self, admin_client, debt_sale):
        resp = admin_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["client_name"] == "Test Client"

    def test_list_unauthenticated(self, anon_client):
        resp = anon_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_by_status(self, admin_client, debt_sale):
        resp = admin_client.get(LIST_URL, {"status": "active"})
        assert resp.data["count"] == 1

        resp = admin_client.get(LIST_URL, {"status": "closed"})
        assert resp.data["count"] == 0


class TestDebtDetail:
    def test_detail_includes_payments(self, admin_client, debt_sale):
        resp = admin_client.get(detail_url(debt_sale.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert "payments" in resp.data
        assert resp.data["remaining"] == "200.00"

    def test_detail_shows_remaining(self, admin_client, debt_sale):
        # Make a partial payment
        admin_client.post(pay_url(debt_sale.pk), {"amount": "50.00"}, format="json")
        resp = admin_client.get(detail_url(debt_sale.pk))
        assert resp.data["remaining"] == "150.00"


# ── Payments ──────────────────────────────────────────────────────────


class TestPayment:
    def test_partial_payment(self, admin_client, debt_sale):
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "80.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["paid_amount"] == "80.00"
        assert resp.data["remaining"] == "120.00"
        assert resp.data["status"] == "active"
        assert len(resp.data["payments"]) == 1

    def test_full_payment_closes_debt(self, admin_client, debt_sale):
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "200.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == "closed"
        assert resp.data["remaining"] == "0.00"

    def test_multiple_partial_payments(self, admin_client, debt_sale):
        admin_client.post(pay_url(debt_sale.pk), {"amount": "50.00"}, format="json")
        admin_client.post(pay_url(debt_sale.pk), {"amount": "50.00"}, format="json")
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "100.00"}, format="json"
        )
        assert resp.data["status"] == "closed"
        assert resp.data["paid_amount"] == "200.00"
        assert len(resp.data["payments"]) == 3

    def test_overpayment_rejected(self, admin_client, debt_sale):
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "999.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_payment_on_closed_debt_rejected(self, admin_client, debt_sale):
        # Close the debt
        admin_client.post(
            pay_url(debt_sale.pk), {"amount": "200.00"}, format="json"
        )
        # Try to pay again
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "10.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_zero_amount_rejected(self, admin_client, debt_sale):
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "0.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_negative_amount_rejected(self, admin_client, debt_sale):
        resp = admin_client.post(
            pay_url(debt_sale.pk), {"amount": "-10.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ── Permissions ───────────────────────────────────────────────────────


class TestDebtPermissions:
    def test_seller_can_view(self, seller_client, debt_sale):
        resp = seller_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK

    def test_seller_can_pay(self, seller_client, debt_sale):
        resp = seller_client.post(
            pay_url(debt_sale.pk), {"amount": "10.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_200_OK


# ── Tenant isolation ─────────────────────────────────────────────────


class TestDebtTenantIsolation:
    def test_cannot_see_other_tenant_debts(self, other_tenant_client, debt_sale):
        resp = other_tenant_client.get(LIST_URL)
        assert resp.data["count"] == 0

    def test_cannot_pay_other_tenant_debt(self, other_tenant_client, debt_sale):
        """Debt from tenant A is not accessible by tenant B's user."""
        resp = other_tenant_client.post(
            pay_url(debt_sale.pk), {"amount": "10.00"}, format="json"
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        assert Payment.objects.count() == 0


# ── Direct creation blocked ─────────────────────────────────────────


class TestDebtDirectCreateBlocked:
    """Debts must only be created via debt-type sales, never directly."""

    def test_post_to_list_not_allowed(self, admin_client, client_obj):
        resp = admin_client.post(
            LIST_URL,
            {"client": str(client_obj.pk), "total_amount": "500.00"},
            format="json",
        )
        assert resp.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
