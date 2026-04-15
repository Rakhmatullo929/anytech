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
            phone="+998901110001",
            email="new@test.com",
            password="StrongPass123!",
            tenant=tenant,
        )
        assert user.phone == "+998901110001"
        assert user.check_password("StrongPass123!")
        assert user.role == User.Role.SELLER  # default
        assert user.is_active is True
        assert user.is_staff is False

    def test_create_user_without_phone_raises(self):
        with pytest.raises(ValueError, match="Phone is required"):
            User.objects.create_user(phone="", password="StrongPass123!")

    def test_create_superuser(self, tenant):
        su = User.objects.create_superuser(
            phone="+998901110002",
            email="super@test.com",
            password="StrongPass123!",
            tenant=tenant,
        )
        assert su.role == User.Role.ADMIN
        assert su.is_staff is True
        assert su.is_superuser is True

    def test_phone_is_username_field(self):
        assert User.USERNAME_FIELD == "phone"

    def test_str(self, admin_user):
        assert str(admin_user) == admin_user.phone


# ── Registration tests ────────────────────────────────────────────────


REGISTER_URL = reverse("auth-register")


class TestRegistration:
    def test_register_success(self, anon_client):
        data = {
            "tenant_name": "New Company",
            "name": "John Doe",
            "phone": "+998901110003",
            "email": "john@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["phone"] == "+998901110003"
        assert resp.data["user"]["role"] == "admin"

        # Tenant and user were created
        assert Tenant.objects.filter(name="New Company").exists()
        assert User.objects.filter(email="john@example.com").exists()

    def test_register_duplicate_phone(self, anon_client, admin_user):
        data = {
            "tenant_name": "Dup Co",
            "name": "Dup",
            "phone": admin_user.phone,
            "email": "dup@test.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, anon_client):
        data = {
            "tenant_name": "Mis Co",
            "name": "Mis",
            "phone": "+998901110004",
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
            "phone": "+998901110005",
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
            {"phone": admin_user.phone, "password": "StrongPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["phone"] == admin_user.phone
        assert resp.data["user"]["role"] == "admin"
        assert resp.data["user"]["tenant_id"] == str(admin_user.tenant_id)

    def test_login_wrong_password(self, anon_client, admin_user):
        resp = anon_client.post(
            LOGIN_URL,
            {"phone": admin_user.phone, "password": "WrongPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, anon_client):
        resp = anon_client.post(
            LOGIN_URL,
            {"phone": "+998901119999", "password": "StrongPass123!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ── Token refresh tests ──────────────────────────────────────────────


REFRESH_URL = reverse("auth-token-refresh")


class TestTokenRefresh:
    def test_refresh_success(self, anon_client, admin_user):
        login_resp = anon_client.post(
            LOGIN_URL,
            {"phone": admin_user.phone, "password": "StrongPass123!"},
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
USERS_URL = reverse("auth-users")
USER_DETAIL_URL = lambda user_id: reverse("auth-user-detail", kwargs={"pk": user_id})
IMPERSONATE_URL = reverse("auth-impersonate")
ROLES_URL = reverse("auth-roles")
ROLE_PERMISSIONS_URL = lambda role: reverse("auth-role-permissions", kwargs={"role": role})


class TestMeEndpoint:
    def test_me_authenticated(self, admin_client, admin_user):
        resp = admin_client.get(ME_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["user"]["phone"] == admin_user.phone
        assert resp.data["user"]["name"] == admin_user.name
        assert resp.data["user"]["role"] == admin_user.role
        assert "permissions" in resp.data["user"]
        assert isinstance(resp.data["user"]["permissions"], list)

    def test_me_unauthenticated(self, anon_client):
        resp = anon_client.get(ME_URL)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


class TestTenantUsersEndpoint:
    def test_users_list_admin_success(self, admin_client, admin_user, manager_user, seller_user):
        resp = admin_client.get(USERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data
        phones = {row["phone"] for row in resp.data["results"]}
        assert admin_user.phone in phones
        assert manager_user.phone in phones
        assert seller_user.phone in phones

    def test_users_list_forbidden_for_manager(self, manager_client):
        resp = manager_client.get(USERS_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_users_list_forbidden_for_seller(self, seller_client):
        resp = seller_client.get(USERS_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_users_list_is_tenant_scoped(self, admin_client, other_tenant_user):
        resp = admin_client.get(USERS_URL)
        assert resp.status_code == status.HTTP_200_OK
        phones = {row["phone"] for row in resp.data["results"]}
        assert other_tenant_user.phone not in phones

    def test_user_detail_admin_success(self, admin_client, manager_user):
        resp = admin_client.get(USER_DETAIL_URL(manager_user.id))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == str(manager_user.id)
        assert resp.data["phone"] == manager_user.phone

    def test_user_detail_forbidden_for_manager(self, manager_client, seller_user):
        resp = manager_client.get(USER_DETAIL_URL(seller_user.id))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_user_detail_is_tenant_scoped(self, admin_client, other_tenant_user):
        resp = admin_client.get(USER_DETAIL_URL(other_tenant_user.id))
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_users_create_admin_success(self, admin_client, tenant):
        payload = {
            "name": "Created Manager",
            "phone": "+998901110199",
            "email": "created-manager@test.com",
            "passport_series": "AB1231212",
            "gender": "male",
            "role": "manager",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = admin_client.post(USERS_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "id" in resp.data
        assert resp.data["role"] == "manager"
        created = User.objects.get(phone=payload["phone"])
        assert created.tenant_id == tenant.id
        assert created.role == User.Role.MANAGER
        assert created.passport_series == "AB1231212"
        assert created.gender == User.Gender.MALE

    def test_users_update_admin_success(self, admin_client, manager_user):
        resp = admin_client.patch(
            USER_DETAIL_URL(manager_user.id),
            {
                "name": "Manager Updated",
                "phone": manager_user.phone,
                "email": manager_user.email,
                "passport_series": "CD7654321",
                "gender": "female",
                "role": "seller",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["id"] == str(manager_user.id)
        manager_user.refresh_from_db()
        assert manager_user.name == "Manager Updated"
        assert manager_user.role == User.Role.SELLER
        assert manager_user.passport_series == "CD7654321"
        assert manager_user.gender == User.Gender.FEMALE

    def test_users_create_invalid_passport_series_rejected(self, admin_client):
        payload = {
            "name": "Invalid Passport",
            "phone": "+998901110198",
            "role": "seller",
            "passport_series": "A1234567",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = admin_client.post(USERS_URL, payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_users_delete_admin_success(self, admin_client, manager_user):
        resp = admin_client.delete(USER_DETAIL_URL(manager_user.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert User.objects.filter(id=manager_user.id).exists() is False

    def test_users_delete_self_rejected(self, admin_client, admin_user):
        resp = admin_client.delete(USER_DETAIL_URL(admin_user.id))
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_roles_list_admin_success(self, admin_client):
        resp = admin_client.get(ROLES_URL)
        assert resp.status_code == status.HTTP_200_OK
        assert "results" in resp.data
        values = {row["value"] for row in resp.data["results"]}
        assert values == {"admin", "manager", "seller"}
        for row in resp.data["results"]:
            assert "permissions" in row
            assert isinstance(row["permissions"], list)
            assert "label" in row

    def test_roles_list_forbidden_for_manager(self, manager_client):
        resp = manager_client.get(ROLES_URL)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_role_permissions_update_admin_success(self, admin_client):
        payload = {"permissions": ["products:read", "products:write", "clients:read"]}
        resp = admin_client.patch(ROLE_PERMISSIONS_URL("manager"), payload, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["value"] == "manager"
        assert sorted(resp.data["permissions"]) == sorted(payload["permissions"])

        roles_resp = admin_client.get(ROLES_URL)
        assert roles_resp.status_code == status.HTTP_200_OK
        manager_row = next(row for row in roles_resp.data["results"] if row["value"] == "manager")
        assert sorted(manager_row["permissions"]) == sorted(payload["permissions"])

    def test_role_permissions_update_forbidden_for_manager(self, manager_client):
        resp = manager_client.patch(
            ROLE_PERMISSIONS_URL("seller"),
            {"permissions": ["pos:read"]},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


class TestImpersonateEndpoint:
    def test_impersonate_admin_success(self, admin_client, manager_user):
        resp = admin_client.post(
            IMPERSONATE_URL,
            {"user_id": str(manager_user.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["id"] == str(manager_user.id)
        assert resp.data["user"]["role"] == manager_user.role

    def test_impersonate_forbidden_for_manager(self, manager_client, seller_user):
        resp = manager_client.post(
            IMPERSONATE_URL,
            {"user_id": str(seller_user.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_impersonate_other_tenant_user_rejected(self, admin_client, other_tenant_user):
        resp = admin_client.post(
            IMPERSONATE_URL,
            {"user_id": str(other_tenant_user.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


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
