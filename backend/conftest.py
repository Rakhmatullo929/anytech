"""
Shared pytest fixtures for the AnyTech ERP/POS test suite.

Provides: tenants, users (admin/manager/seller), authenticated API clients,
products, clients, and helper factories.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from auth_tenant.models import Tenant, User
from clients.models import Client
from products.models import Product


# ── Tenants ───────────────────────────────────────────────────────────


@pytest.fixture
def tenant(db):
    return Tenant.objects.create(name="Test Tenant")


@pytest.fixture
def other_tenant(db):
    """Second tenant for isolation tests."""
    return Tenant.objects.create(name="Other Tenant")


# ── Users ─────────────────────────────────────────────────────────────


@pytest.fixture
def admin_user(tenant):
    return User.objects.create_user(
        email="admin@test.com",
        password="StrongPass123!",
        name="Admin User",
        tenant=tenant,
        role=User.Role.ADMIN,
    )


@pytest.fixture
def manager_user(tenant):
    return User.objects.create_user(
        email="manager@test.com",
        password="StrongPass123!",
        name="Manager User",
        tenant=tenant,
        role=User.Role.MANAGER,
    )


@pytest.fixture
def seller_user(tenant):
    return User.objects.create_user(
        email="seller@test.com",
        password="StrongPass123!",
        name="Seller User",
        tenant=tenant,
        role=User.Role.SELLER,
    )


@pytest.fixture
def other_tenant_user(other_tenant):
    """User belonging to a different tenant."""
    return User.objects.create_user(
        email="other@test.com",
        password="StrongPass123!",
        name="Other User",
        tenant=other_tenant,
        role=User.Role.ADMIN,
    )


# ── Authenticated API Clients ─────────────────────────────────────────


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def manager_client(manager_user):
    client = APIClient()
    client.force_authenticate(user=manager_user)
    return client


@pytest.fixture
def seller_client(seller_user):
    client = APIClient()
    client.force_authenticate(user=seller_user)
    return client


@pytest.fixture
def other_tenant_client(other_tenant_user):
    client = APIClient()
    client.force_authenticate(user=other_tenant_user)
    return client


@pytest.fixture
def anon_client():
    return APIClient()


# ── Domain objects ────────────────────────────────────────────────────


@pytest.fixture
def product(tenant):
    return Product.objects.create(
        tenant=tenant,
        name="Test Product",
        sku="TP-001",
        purchase_price=Decimal("50.00"),
        sale_price=Decimal("100.00"),
        stock=20,
    )


@pytest.fixture
def product_no_sku(tenant):
    return Product.objects.create(
        tenant=tenant,
        name="No SKU Product",
        purchase_price=Decimal("30.00"),
        sale_price=Decimal("60.00"),
        stock=10,
    )


@pytest.fixture
def client_obj(tenant):
    """Client model instance (named client_obj to avoid clash with pytest client fixture)."""
    return Client.objects.create(
        tenant=tenant,
        name="Test Client",
        phone="+998901234567",
    )


# ── Helpers ───────────────────────────────────────────────────────────


def make_sale_payload(product, quantity=2, payment_type="cash", client_id=None):
    payload = {
        "payment_type": payment_type,
        "items": [{"product": str(product.pk), "quantity": quantity}],
    }
    if client_id:
        payload["client"] = str(client_id)
    return payload
