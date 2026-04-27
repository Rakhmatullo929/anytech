import pytest
from django.urls import reverse
from rest_framework import status

from products.models import Category

pytestmark = pytest.mark.django_db

LIST_URL = reverse("category-list")


def detail_url(pk):
    return reverse("category-detail", args=[pk])


class TestCategoryCrud:
    def test_list_categories(self, manager_client, category):
        resp = manager_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["name"] == category.name

    def test_admin_can_create(self, admin_client, tenant):
        resp = admin_client.post(LIST_URL, {"name": "Phones"}, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == "Phones"
        assert str(resp.data["tenant"]) == str(tenant.pk)

    def test_seller_cannot_create(self, seller_client):
        resp = seller_client.post(LIST_URL, {"name": "Forbidden"}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update(self, admin_client, category):
        resp = admin_client.put(detail_url(category.pk), {"name": "Updated"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == "Updated"

    def test_admin_can_delete(self, admin_client, category):
        resp = admin_client.delete(detail_url(category.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Category.objects.filter(pk=category.pk).exists()

    def test_admin_can_bulk_delete(self, admin_client, tenant):
        c1 = Category.objects.create(tenant=tenant, name="Bulk 1")
        c2 = Category.objects.create(tenant=tenant, name="Bulk 2")
        resp = admin_client.post(
            reverse("category-bulk-delete"),
            {"ids": [str(c1.pk), str(c2.pk)]},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["deleted"] == 2


class TestCategoryIsolation:
    def test_other_tenant_cannot_see_categories(self, other_tenant_client, category):
        resp = other_tenant_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_other_tenant_cannot_access_category(self, other_tenant_client, category):
        resp = other_tenant_client.get(detail_url(category.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND
