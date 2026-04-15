"""
Tests for clients app — Stage 4.

Covers: CRUD, phone uniqueness per tenant, detail with sales/debt,
RBAC permissions, tenant data isolation.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from clients.models import Client

pytestmark = pytest.mark.django_db

LIST_URL = reverse("client-list")
SEARCH_URL = reverse("client-search")


def detail_url(pk):
    return reverse("client-detail", args=[pk])


# ── Model tests ───────────────────────────────────────────────────────


class TestClientModel:
    def test_str(self, client_obj):
        assert str(client_obj) == "Test Client"

    def test_uuid_pk(self, client_obj):
        assert len(str(client_obj.pk)) == 36

    def test_unique_phone_per_tenant(self, tenant, client_obj):
        with pytest.raises(Exception):  # IntegrityError
            Client.objects.create(
                tenant=tenant, name="Duplicate", phone=client_obj.phone
            )

    def test_same_phone_different_tenant(self, other_tenant, client_obj):
        """Same phone number allowed for different tenants."""
        c = Client.objects.create(
            tenant=other_tenant, name="Other", phone=client_obj.phone
        )
        assert c.pk is not None


# ── List / Retrieve ──────────────────────────────────────────────────


class TestClientList:
    def test_list(self, manager_client, client_obj):
        resp = manager_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_unauthenticated(self, anon_client):
        resp = anon_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_detail(self, manager_client, client_obj):
        resp = manager_client.get(detail_url(client_obj.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Test Client"
        assert "sales" in resp.data
        assert "total_debt" in resp.data


# ── Create ────────────────────────────────────────────────────────────


class TestClientCreate:
    PAYLOAD = {"name": "New Client", "phone": "+998900000001"}

    def test_admin_can_create(self, admin_client, tenant):
        resp = admin_client.post(LIST_URL, self.PAYLOAD, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert str(resp.data["tenant"]) == str(tenant.pk)

    def test_manager_cannot_create(self, manager_client):
        resp = manager_client.post(LIST_URL, self.PAYLOAD, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_seller_cannot_create(self, seller_client):
        resp = seller_client.post(LIST_URL, self.PAYLOAD, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_duplicate_phone_rejected(self, admin_client, client_obj):
        resp = admin_client.post(
            LIST_URL,
            {"name": "Dup", "phone": client_obj.phone},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_empty_phone_rejected(self, admin_client):
        resp = admin_client.post(
            LIST_URL, {"name": "Empty", "phone": "   "}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ── Update ────────────────────────────────────────────────────────────


class TestClientUpdate:
    def test_admin_can_update(self, admin_client, client_obj):
        resp = admin_client.put(
            detail_url(client_obj.pk),
            {"name": "Updated", "phone": "+998901111111"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Updated"

    def test_seller_cannot_update(self, seller_client, client_obj):
        resp = seller_client.put(
            detail_url(client_obj.pk),
            {"name": "Hack", "phone": "+998900000000"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_partial_update(self, admin_client, client_obj):
        resp = admin_client.patch(
            detail_url(client_obj.pk),
            {"name": "Patched"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Patched"


# ── Tenant isolation ─────────────────────────────────────────────────


class TestClientTenantIsolation:
    def test_cannot_see_other_tenant_clients(self, other_tenant_client, client_obj):
        resp = other_tenant_client.get(LIST_URL)
        assert resp.data["count"] == 0

    def test_cannot_access_other_tenant_client(self, other_tenant_client, client_obj):
        resp = other_tenant_client.get(detail_url(client_obj.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ── Search ────────────────────────────────────────────────────────────


class TestClientSearch:
    def test_search_by_name(self, manager_client, client_obj):
        resp = manager_client.get(SEARCH_URL, {"search": "Test"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_search_by_phone(self, manager_client, client_obj):
        resp = manager_client.get(SEARCH_URL, {"search": "9012345"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_search_no_match(self, manager_client, client_obj):
        resp = manager_client.get(SEARCH_URL, {"search": "ZZZ"})
        assert resp.data["count"] == 0
