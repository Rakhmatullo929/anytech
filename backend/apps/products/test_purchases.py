import pytest
from django.urls import reverse
from rest_framework import status

from products.models import Product, ProductPurchase

pytestmark = pytest.mark.django_db

LIST_URL = reverse("product-purchase-list")


def detail_url(pk):
    return reverse("product-purchase-detail", args=[pk])


class TestProductPurchaseCrud:
    def test_list_purchases(self, manager_client, product):
        purchase = ProductPurchase.objects.create(
            product=product,
            quantity=10,
            unit_price="900.00",
            currency="USD",
        )
        resp = manager_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1
        assert resp.data["results"][0]["id"] == str(purchase.pk)

    def test_list_purchases_filtered_by_product(self, manager_client, tenant):
        p1 = Product.objects.create(tenant=tenant, name="P1", sku="P1")
        p2 = Product.objects.create(tenant=tenant, name="P2", sku="P2")
        ProductPurchase.objects.create(product=p1, quantity=10, unit_price="900.00", currency="USD")
        ProductPurchase.objects.create(product=p2, quantity=5, unit_price="800.00", currency="USD")

        resp = manager_client.get(LIST_URL, {"product_id": str(p1.pk)})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 1
        assert str(resp.data["results"][0]["product"]) == str(p1.pk)

    def test_admin_can_create(self, admin_client, product):
        payload = {
            "product": str(product.pk),
            "quantity": 10,
            "unit_price": "900.00",
            "currency": "USD",
        }
        resp = admin_client.post(LIST_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["quantity"] == 10
        assert resp.data["unit_price"] == "900.00"

    def test_seller_cannot_create(self, seller_client, product):
        payload = {
            "product": str(product.pk),
            "quantity": 10,
            "unit_price": "900.00",
            "currency": "USD",
        }
        resp = seller_client.post(LIST_URL, payload, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_update(self, admin_client, product):
        purchase = ProductPurchase.objects.create(
            product=product,
            quantity=10,
            unit_price="900.00",
            currency="USD",
        )
        resp = admin_client.put(
            detail_url(purchase.pk),
            {
                "product": str(product.pk),
                "quantity": 5,
                "unit_price": "800.00",
                "currency": "USD",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["quantity"] == 5
        assert resp.data["unit_price"] == "800.00"

    def test_admin_can_delete(self, admin_client, product):
        purchase = ProductPurchase.objects.create(
            product=product,
            quantity=10,
            unit_price="900.00",
            currency="USD",
        )
        resp = admin_client.delete(detail_url(purchase.pk))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not ProductPurchase.objects.filter(pk=purchase.pk).exists()

    def test_admin_can_bulk_delete(self, admin_client, product):
        p1 = ProductPurchase.objects.create(
            product=product,
            quantity=10,
            unit_price="900.00",
            currency="USD",
        )
        p2 = ProductPurchase.objects.create(
            product=product,
            quantity=5,
            unit_price="800.00",
            currency="USD",
        )
        resp = admin_client.post(
            reverse("product-purchase-bulk-delete"),
            {"ids": [str(p1.pk), str(p2.pk)]},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["deleted"] == 2


class TestProductPurchaseIsolation:
    def test_other_tenant_cannot_see_purchase(self, other_tenant_client, product):
        ProductPurchase.objects.create(
            product=product,
            quantity=10,
            unit_price="900.00",
            currency="USD",
        )
        resp = other_tenant_client.get(LIST_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["count"] == 0

    def test_other_tenant_cannot_access_purchase(self, other_tenant_client, product):
        purchase = ProductPurchase.objects.create(
            product=product,
            quantity=10,
            unit_price="900.00",
            currency="USD",
        )
        resp = other_tenant_client.get(detail_url(purchase.pk))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_create_purchase_for_other_tenant_product(
        self, admin_client, other_tenant
    ):
        other_product = Product.objects.create(
            tenant=other_tenant,
            name="Other Product",
            sku="OTHER-001",
        )
        payload = {
            "product": str(other_product.pk),
            "quantity": 10,
            "unit_price": "900.00",
            "currency": "USD",
        }
        resp = admin_client.post(LIST_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "product" in resp.data
