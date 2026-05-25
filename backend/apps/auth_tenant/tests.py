"""
Tests for auth_tenant app — Stage 1.

Covers: registration, login, token refresh, /me endpoint,
custom JWT claims, permissions, and model basics.
"""
import pytest
from django.urls import reverse
from rest_framework import status

from apps.auth_tenant.models import Tenant, User
from apps.auth_tenant.permission_catalog import ADMIN_REQUIRED_PERMISSIONS
from apps.auth_tenant.permissions import IsAdmin, IsManagerOrAbove, IsSellerOrAbove

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
        assert user.role == "seller"  # default
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
        assert su.role == "admin"
        assert su.is_staff is True
        assert su.is_superuser is True

    def test_phone_is_username_field(self):
        assert User.USERNAME_FIELD == "phone"

    def test_str(self, admin_user):
        assert str(admin_user) == admin_user.phone


# ── TenantQuerySetMixin tests ────────────────────────────────────────


class TestTenantQuerySetMixin:
    """The mixin must refuse a payload tenant that doesn't match the caller's
    instead of silently overriding it."""

    def _build(self, request_user):
        from types import SimpleNamespace
        from apps.auth_tenant.mixins import TenantQuerySetMixin

        # Bare mixin instance with just the request attribute it touches.
        view = TenantQuerySetMixin()
        view.request = SimpleNamespace(user=request_user)
        return view

    def _serializer(self, validated_data):
        from types import SimpleNamespace

        calls = []

        def save(**kwargs):
            calls.append(kwargs)

        return SimpleNamespace(validated_data=validated_data, save=save), calls

    def test_payload_with_matching_tenant_allowed(self, admin_user):
        view = self._build(admin_user)
        serializer, calls = self._serializer({"tenant": admin_user.tenant})
        view.perform_update(serializer)
        view.perform_create(serializer)
        assert len(calls) == 2
        assert all(c == {"tenant": admin_user.tenant} for c in calls)

    def test_payload_with_other_tenant_raises_403(self, admin_user, other_tenant):
        from rest_framework.exceptions import PermissionDenied

        view = self._build(admin_user)
        serializer, calls = self._serializer({"tenant": other_tenant})
        with pytest.raises(PermissionDenied):
            view.perform_update(serializer)
        with pytest.raises(PermissionDenied):
            view.perform_create(serializer)
        assert calls == []  # never reached serializer.save

    def test_empty_validated_data_uses_request_tenant(self, admin_user):
        """The common case: serializer marks tenant read-only, so validated_data
        has no tenant key. Mixin injects the caller's tenant on save."""
        view = self._build(admin_user)
        serializer, calls = self._serializer({"name": "anything"})
        view.perform_create(serializer)
        assert calls == [{"tenant": admin_user.tenant}]


# ── Registration tests ────────────────────────────────────────────────


REGISTER_URL = reverse("auth-register")


class TestRegistration:
    def test_register_success(self, anon_client):
        data = {
            "tenant_name": "New Company",
            "first_name": "John",
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

    def test_register_with_phone_already_in_another_tenant_creates_new_tenant(
        self, anon_client, admin_user
    ):
        """Multi-tenant identity: the same phone may register a NEW tenant even
        if the phone already belongs to a user in some other tenant.
        Uniqueness is enforced per-tenant (see User.Meta.constraints)."""
        data = {
            "tenant_name": "Second Org",
            "first_name": "Dup",
            "phone": admin_user.phone,
            "email": "dup@test.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = anon_client.post(REGISTER_URL, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        new_user = User.objects.get(email="dup@test.com")
        assert new_user.phone == admin_user.phone
        assert new_user.tenant_id != admin_user.tenant_id

    def test_register_password_mismatch(self, anon_client):
        data = {
            "tenant_name": "Mis Co",
            "first_name": "Mis",
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
            "first_name": "Weak",
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


# ── Multi-tenant identity tests ──────────────────────────────────────


SHARED_PHONE = "+998901112000"


class TestPerTenantUniqueness:
    """Phone/email uniqueness is scoped to tenant, not global."""

    def test_same_phone_allowed_across_tenants(self, tenant, other_tenant):
        a = User.objects.create_user(
            phone=SHARED_PHONE, password="PassA12345!", tenant=tenant, role="admin"
        )
        b = User.objects.create_user(
            phone=SHARED_PHONE, password="PassB12345!", tenant=other_tenant, role="admin"
        )
        assert a.tenant_id != b.tenant_id
        assert a.phone == b.phone

    def test_same_phone_rejected_within_tenant(self, tenant):
        User.objects.create_user(
            phone=SHARED_PHONE, password="PassA12345!", tenant=tenant, role="admin"
        )
        from django.db.utils import IntegrityError

        with pytest.raises(IntegrityError):
            User.objects.create_user(
                phone=SHARED_PHONE, password="PassB12345!", tenant=tenant, role="seller"
            )


class TestMultiTenantLogin:
    """Phone+password login disambiguation across tenants."""

    @pytest.fixture
    def multi_tenant_users(self, tenant, other_tenant):
        # Same phone, *different* passwords across tenants → password decides.
        u1 = User.objects.create_user(
            phone=SHARED_PHONE,
            password="PasswordTenantA!",
            tenant=tenant,
            role="admin",
        )
        u2 = User.objects.create_user(
            phone=SHARED_PHONE,
            password="PasswordTenantB!",
            tenant=other_tenant,
            role="admin",
        )
        return u1, u2

    def test_login_picks_user_by_password(self, anon_client, multi_tenant_users):
        u1, u2 = multi_tenant_users
        resp = anon_client.post(
            LOGIN_URL,
            {"phone": SHARED_PHONE, "password": "PasswordTenantB!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["user"]["tenant_id"] == str(u2.tenant_id)

    def test_login_ambiguous_returns_tenants_list(self, anon_client, tenant, other_tenant):
        # Same phone *and* same password in two tenants → server can't pick.
        User.objects.create_user(
            phone=SHARED_PHONE, password="SamePass12345!", tenant=tenant, role="admin"
        )
        User.objects.create_user(
            phone=SHARED_PHONE, password="SamePass12345!", tenant=other_tenant, role="admin"
        )

        resp = anon_client.post(
            LOGIN_URL,
            {"phone": SHARED_PHONE, "password": "SamePass12345!"},
            format="json",
        )
        assert resp.status_code == 409
        assert resp.data["code"] == "multi_tenant"
        assert len(resp.data["tenants"]) == 2
        tenant_ids = {t["id"] for t in resp.data["tenants"]}
        assert tenant_ids == {str(tenant.id), str(other_tenant.id)}

    def test_login_with_tenant_id_resolves_ambiguity(
        self, anon_client, tenant, other_tenant
    ):
        User.objects.create_user(
            phone=SHARED_PHONE, password="SamePass12345!", tenant=tenant, role="admin"
        )
        User.objects.create_user(
            phone=SHARED_PHONE, password="SamePass12345!", tenant=other_tenant, role="admin"
        )

        resp = anon_client.post(
            LOGIN_URL,
            {
                "phone": SHARED_PHONE,
                "password": "SamePass12345!",
                "tenant_id": str(other_tenant.id),
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["user"]["tenant_id"] == str(other_tenant.id)

    def test_login_with_wrong_tenant_id_rejected(self, anon_client, multi_tenant_users, other_tenant):
        # tenant_id narrows the search; if no user in that tenant matches → 401.
        resp = anon_client.post(
            LOGIN_URL,
            {
                "phone": SHARED_PHONE,
                "password": "PasswordTenantA!",  # tenant A's password
                "tenant_id": str(other_tenant.id),  # but tenant B
            },
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

    def test_rotated_refresh_blacklists_old(self, anon_client, admin_user):
        login_resp = anon_client.post(
            LOGIN_URL,
            {"phone": admin_user.phone, "password": "StrongPass123!"},
            format="json",
        )
        first_refresh = login_resp.data["refresh"]

        rotated = anon_client.post(
            REFRESH_URL, {"refresh": first_refresh}, format="json"
        )
        assert rotated.status_code == status.HTTP_200_OK
        assert "refresh" in rotated.data
        assert rotated.data["refresh"] != first_refresh

        # Replaying the old refresh must fail — it's blacklisted.
        replay = anon_client.post(
            REFRESH_URL, {"refresh": first_refresh}, format="json"
        )
        assert replay.status_code == status.HTTP_401_UNAUTHORIZED


# ── Logout tests ─────────────────────────────────────────────────────


LOGOUT_URL = reverse("auth-logout")


class TestLogout:
    def test_logout_blacklists_refresh(self, anon_client, admin_client, admin_user):
        login_resp = anon_client.post(
            LOGIN_URL,
            {"phone": admin_user.phone, "password": "StrongPass123!"},
            format="json",
        )
        refresh_token = login_resp.data["refresh"]

        resp = admin_client.post(LOGOUT_URL, {"refresh": refresh_token}, format="json")
        assert resp.status_code == status.HTTP_205_RESET_CONTENT

        # Blacklisted refresh can no longer be used.
        replay = anon_client.post(
            REFRESH_URL, {"refresh": refresh_token}, format="json"
        )
        assert replay.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_requires_refresh(self, admin_client):
        resp = admin_client.post(LOGOUT_URL, {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_invalid_refresh(self, admin_client):
        resp = admin_client.post(LOGOUT_URL, {"refresh": "garbage"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_unauthenticated(self, anon_client):
        resp = anon_client.post(LOGOUT_URL, {"refresh": "any"}, format="json")
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
        assert resp.data["user"]["first_name"] == admin_user.first_name
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
        import uuid
        payload = {
            "first_name": "Created",
            "last_name": "Manager",
            "middle_name": "",
            "birth_date": "1995-01-01",
            "phone": "+998901110199",
            "email": "created-manager@test.com",
            "passport_series": "AB1231212",
            "gender": "male",
            "role": "manager",
            "region_id": str(uuid.uuid4()),
            "district_id": str(uuid.uuid4()),
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }
        resp = admin_client.post(USERS_URL, payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert "id" in resp.data
        assert resp.data["role"] == "manager"
        created = User.objects.get(phone=payload["phone"])
        assert created.tenant_id == tenant.id
        assert created.role == "manager"
        assert created.passport_series == "AB1231212"
        assert created.gender == User.Gender.MALE

    def test_users_update_admin_success(self, admin_client, manager_user):
        resp = admin_client.patch(
            USER_DETAIL_URL(manager_user.id),
            {
                "first_name": "Manager",
                "last_name": "Updated",
                "middle_name": "M",
                "birth_date": "1994-02-02",
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
        assert manager_user.first_name == "Manager"
        assert manager_user.last_name == "Updated"
        assert manager_user.role == "seller"
        assert manager_user.passport_series == "CD7654321"
        assert manager_user.gender == User.Gender.FEMALE

    def test_users_create_invalid_passport_series_rejected(self, admin_client):
        payload = {
            "first_name": "Invalid",
            "last_name": "Passport",
            "middle_name": "",
            "birth_date": "1990-05-10",
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

    def test_role_permissions_update_admin_preserves_critical_permissions(self, admin_client):
        payload = {"permissions": ["products:read", "clients:read"]}
        resp = admin_client.patch(ROLE_PERMISSIONS_URL("admin"), payload, format="json")
        assert resp.status_code == status.HTTP_200_OK

        response_permissions = set(resp.data["permissions"])
        assert response_permissions.issuperset(set(ADMIN_REQUIRED_PERMISSIONS))
        assert {"products:read", "clients:read"}.issubset(response_permissions)

        roles_resp = admin_client.get(ROLES_URL)
        assert roles_resp.status_code == status.HTTP_200_OK
        admin_row = next(row for row in roles_resp.data["results"] if row["value"] == "admin")
        assert set(admin_row["permissions"]).issuperset(set(ADMIN_REQUIRED_PERMISSIONS))

    def test_role_permissions_update_admin_clear_keeps_critical_permissions(self, admin_client):
        resp = admin_client.patch(ROLE_PERMISSIONS_URL("admin"), {"permissions": []}, format="json")
        assert resp.status_code == status.HTTP_200_OK

        response_permissions = set(resp.data["permissions"])
        assert response_permissions == set(ADMIN_REQUIRED_PERMISSIONS)

        roles_resp = admin_client.get(ROLES_URL)
        assert roles_resp.status_code == status.HTTP_200_OK
        admin_row = next(row for row in roles_resp.data["results"] if row["value"] == "admin")
        assert set(admin_row["permissions"]) == set(ADMIN_REQUIRED_PERMISSIONS)


class TestPermissionsCache:
    """Cross-request caching of resolved (tenant, role) permissions."""

    @pytest.fixture(autouse=True)
    def _clear_cache(self):
        from django.core.cache import cache

        cache.clear()
        yield
        cache.clear()

    def test_second_call_hits_cache(self, manager_user, django_assert_num_queries):
        from apps.auth_tenant.permissions import get_user_permissions

        # Cold: DB is queried once.
        with django_assert_num_queries(1):
            first = get_user_permissions(manager_user)

        # Fresh User instance (no per-request cache attr) — must hit Layer 2
        # (process/Redis cache) with zero queries.
        refreshed = User.objects.get(pk=manager_user.pk)
        with django_assert_num_queries(0):
            second = get_user_permissions(refreshed)

        assert first == second

    def test_update_invalidates_cache(self, admin_client, manager_user):
        from apps.auth_tenant.permissions import get_user_permissions

        get_user_permissions(manager_user)  # warm cache

        resp = admin_client.patch(
            ROLE_PERMISSIONS_URL("manager"),
            {"permissions": ["products:read", "products:write"]},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK

        # Fresh instance — Layer 2 must reflect the update.
        refreshed = User.objects.get(pk=manager_user.pk)
        new_perms = get_user_permissions(refreshed)
        assert new_perms == {"products:read", "products:write"}

    def test_signal_invalidates_on_direct_save(self, tenant):
        """RolePermission.save() outside the serializer (admin UI, scripts)
        must drop the cache via the post_save signal."""
        from apps.auth_tenant.permissions import get_user_permissions
        from apps.auth_tenant.models import RolePermission

        user = User.objects.create_user(
            phone="+998901119001",
            password="StrongPass123!",
            tenant=tenant,
            role="custom_role",
        )
        first = get_user_permissions(user)

        RolePermission.objects.create(
            tenant=tenant, role="custom_role", permission="reports:read"
        )

        refreshed = User.objects.get(pk=user.pk)
        second = get_user_permissions(refreshed)
        assert second == {"reports:read"}
        assert second != first


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
