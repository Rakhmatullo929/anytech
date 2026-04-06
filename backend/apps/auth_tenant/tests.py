"""
Tests for auth_tenant app — Stage 1.

Covers: registration, login, token refresh, /me endpoint,
custom JWT claims, permissions, and model basics.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from auth_tenant.models import Tenant, User
from auth_tenant.permissions import IsAdmin, IsManagerOrAbove, IsSellerOrAbove

pytestmark = pytest.mark.django_db


# ── Model tests ───────────────────────────────────────────────────────


class TestTenantModel:
    def test_str(self, tenant):
        assert str(tenant) == "Test Tenant"

    def test_uuid_pk(self, tenant):
        assert tenant.pk is not None
        assert len(str(tenant.pk)) == 36  # UUID format


class TestUserModel:
    def test_create_user(self, tenant):
        user = User.objects.create_user(
            email="new@test.com", password="StrongPass123!", tenant=tenant
        )
        assert user.email == "new@test.com"
        assert user.check_password("StrongPass123!")
        assert user.role == User.Role.SELLER  # default
        assert user.is_active is True
        assert user.is_staff is False

    def test_create_user_without_email_raises(self):
        with pytest.raises(ValueError, match="Email is required"):
            User.objects.create_user(email="", password="StrongPass123!")

    def test_create_superuser(self, tenant):
        su = User.objects.create_superuser(
            email="super@test.com", password="StrongPass123!", tenant=tenant
        )
        assert su.role == User.Role.ADMIN
        assert su.is_staff is True
        assert su.is_superuser is True

    def test_email_is_username_field(self):
        assert User.USERNAME_FIELD == "email"

    def test_str(self, admin_user):
        assert str(admin_user) == "admin@test.com"


# ── Registration tests ────────────────────────────────────────────────


REGISTER_URL = reverse("auth-register")


class TestRegistration:
    def test_register_success(self, anon_client):
        data = {
            "tenant_name": "New Company",
            "name": "John Doe",
            "email": "john@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["email"] == "john@example.com"
        assert resp.data["user"]["role"] == "admin"

        # Tenant and user were created
        assert Tenant.objects.filter(name="New Company").exists()
        assert User.objects.filter(email="john@example.com").exists()

    def test_register_duplicate_email(self, anon_client, admin_user):
        data = {
            "tenant_name": "Dup Co",
            "name": "Dup",
            "email": admin_user.email,
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, anon_client):
        data = {
            "tenant_name": "Mis Co",
            "name": "Mis",
            "email": "mis@test.com",
            "password": "StrongPass123!",
            "password_confirm": "DifferentPass123!",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, anon_client):
        data = {
            "tenant_name": "Weak Co",
            "name": "Weak",
            "email": "weak@test.com",
            "password": "123",
            "password_confirm": "123",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_fields(self, anon_client):
        resp = anon_client.post(REGISTER_URL, {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ── Login tests ───────────────────────────────────────────────────────


LOGIN_URL = reverse("auth-login")


class TestLogin:
    def test_login_success(self, anon_client, admin_user):
        resp = anon_client.post(
            LOGIN_URL,
            {"email": "admin@test.com", "password": "StrongPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["email"] == "admin@test.com"
        assert resp.data["user"]["role"] == "admin"
        assert resp.data["user"]["tenant_id"] == str(admin_user.tenant_id)

    def test_login_wrong_password(self, anon_client, admin_user):
        resp = anon_client.post(
            LOGIN_URL,
            {"email": "admin@test.com", "password": "WrongPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, anon_client):
        resp = anon_client.post(
            LOGIN_URL,
            {"email": "ghost@test.com", "password": "StrongPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ── Token refresh tests ──────────────────────────────────────────────


REFRESH_URL = reverse("auth-token-refresh")


class TestTokenRefresh:
    def test_refresh_success(self, anon_client, admin_user):
        login_resp = anon_client.post(
            LOGIN_URL,
            {"email": "admin@test.com", "password": "StrongPass123!"},
            format="json",
        )
        refresh_token = login_resp.data["refresh"]

        resp = anon_client.post(
            REFRESH_URL, {"refresh": refresh_token}, format="json"
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data

    def test_refresh_invalid_token(self, anon_client):
        resp = anon_client.post(
            REFRESH_URL, {"refresh": "invalid-token"}, format="json"
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ── /me endpoint tests ───────────────────────────────────────────────


ME_URL = reverse("auth-me")


class TestMeEndpoint:
    def test_me_authenticated(self, admin_client, admin_user):
        resp = admin_client.get(ME_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["user"]["email"] == admin_user.email
        assert resp.data["user"]["name"] == admin_user.name
        assert resp.data["user"]["role"] == admin_user.role

    def test_me_unauthenticated(self, anon_client):
        resp = anon_client.get(ME_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ── Permission classes (unit) ─────────────────────────────────────────


class TestPermissions:
    class FakeRequest:
        def __init__(self, user):
            self.user = user

    def test_is_admin(self, admin_user, manager_user, seller_user):
        perm = IsAdmin()
        assert perm.has_permission(self.FakeRequest(admin_user), None) is True
        assert perm.has_permission(self.FakeRequest(manager_user), None) is False
        assert perm.has_permission(self.FakeRequest(seller_user), None) is False

    def test_is_manager_or_above(self, admin_user, manager_user, seller_user):
        perm = IsManagerOrAbove()
        assert perm.has_permission(self.FakeRequest(admin_user), None) is True
        assert perm.has_permission(self.FakeRequest(manager_user), None) is True
        assert perm.has_permission(self.FakeRequest(seller_user), None) is False

    def test_is_seller_or_above(self, admin_user, manager_user, seller_user):
        perm = IsSellerOrAbove()
        assert perm.has_permission(self.FakeRequest(admin_user), None) is True
        assert perm.has_permission(self.FakeRequest(manager_user), None) is True
        assert perm.has_permission(self.FakeRequest(seller_user), None) is True
