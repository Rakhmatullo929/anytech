"""
Tests for products app.

Covers: CRUD, SKU constraints, RBAC permissions,
tenant data isolation and search.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from products.models import Product

pytestmark = pytest.mark.django_db

LIST_URL = reverse("product-list")
SEARCH_URL = reverse("product-search")


def detail_url(pk):
    return reverse("product-detail", args=[pk])


class TestProductModel:
    def test_str(self, product):
        assert str(product) == "Test Product"

    def test_uuid_pk(self, product):
        assert len(str(product.pk)) == 36

    def test_unique_sku_per_tenant(self, tenant):
        Product.objects.create(tenant=tenant, name="A", sku="DUP")
        with pytest.raises(Exception):  # IntegrityError
            Product.objects.create(tenant=tenant, name="B", sku="DUP")

    def test_null_sku_not_unique(self, tenant):
        p1 = Product.objects.create(tenant=tenant, name="A", sku=None)
        p2 = Product.objects.create(tenant=tenant, name="B", sku=None)
        assert p1.pk != p2.pk


class TestProductList:
    def test_list_products(self, manager_client, product):
        resp = manager_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["name"] == "Test Product"

    def test_list_unauthenticated(self, anon_client):
        resp = anon_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_product(self, manager_client, product):
        resp = manager_client.get(detail_url(product.pk))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == str(product.pk)
        assert resp.data["name"] == "Test Product"


class TestProductCreate:
    PAYLOAD = {
        "name": "New Product",
        "sku": "NP-001",
    }

    def test_admin_can_create(self, admin_client, tenant):
        resp = admin_client.post(LIST_URL, self.PAYLOAD, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == "New Product"
        assert str(resp.data["tenant"]) == str(tenant.pk)

    def test_manager_cannot_create(self, manager_client):
        resp = manager_client.post(LIST_URL, self.PAYLOAD, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_seller_cannot_create(self, seller_client):
        resp = seller_client.post(LIST_URL, self.PAYLOAD, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_create_without_sku(self, admin_client):
        payload = {**self.PAYLOAD, "sku": ""}
        resp = admin_client.post(LIST_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["sku"] is None

    def test_create_with_category(self, admin_client, category):
        payload = {**self.PAYLOAD, "category": str(category.pk)}
        resp = admin_client.post(LIST_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["category"]["id"] == str(category.pk)
        assert resp.data["category"]["name"] == category.name


class TestProductUpdate:
    def test_admin_can_update(self, admin_client, product):
        resp = admin_client.put(
            detail_url(product.pk),
            {
                "name": "Updated",
                "sku": "TP-001",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Updated"

    def test_seller_cannot_update(self, seller_client, product):
        resp = seller_client.put(
            detail_url(product.pk),
            {"name": "Hack", "sku": "X"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_patch_on_detail_not_allowed(self, admin_client, product):
        resp = admin_client.patch(
            detail_url(product.pk),
            {"name": "Patched"},
            format="json",
        )
        assert resp.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


class TestProductTenantIsolation:
    def test_cannot_see_other_tenant_products(self, other_tenant_client, product):
        resp = other_tenant_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_cannot_access_other_tenant_product(self, other_tenant_client, product):
        resp = other_tenant_client.get(detail_url(product.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_product_auto_assigned_to_tenant(self, admin_client, tenant):
        resp = admin_client.post(
            LIST_URL,
            {
                "name": "Auto Tenant",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert str(resp.data["tenant"]) == str(tenant.pk)


class TestProductSearch:
    def test_search_by_name(self, manager_client, product):
        resp = manager_client.get(SEARCH_URL, {"search": "Test"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1

    def test_search_no_match(self, manager_client, product):
        resp = manager_client.get(SEARCH_URL, {"search": "NonExistent"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0
