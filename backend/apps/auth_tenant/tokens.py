from django.conf import settings
from django.contrib.auth.models import update_last_login
from django.utils.translation import gettext as _
from rest_framework import serializers
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .permissions import get_user_permissions


def build_display_name(user):
    return " ".join(
        part for part in [user.first_name, user.last_name, user.middle_name] if part
    )


class MultiTenantLoginError(APIException):
    """Raised when a phone+password pair authenticates as multiple tenants.

    Inherits from APIException (not serializers.ValidationError) because
    DRF's `serializer.is_valid(raise_exception=True)` rewraps any caught
    ValidationError into a fresh one with status 400 — losing our 409.
    APIException bubbles past `is_valid` to the view's exception_handler
    where `status_code` is honored.
    """

    status_code = 409
    default_code = "multi_tenant"
    default_detail = _("Phone exists in multiple tenants. Re-submit with tenant_id.")

    def __init__(self, tenants):
        super().__init__(
            detail={
                "code": "multi_tenant",
                "detail": str(self.default_detail),
                "tenants": tenants,
            }
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login serializer with multi-tenant phone disambiguation.

    Standard SimpleJWT auth calls `authenticate(phone=..., password=...)`, which
    backs onto `UserManager.get_by_natural_key()` → single-row `.get()`. With
    phone non-unique globally (see User.Meta.constraints), that path explodes
    with MultipleObjectsReturned. So we look up candidates ourselves and pick
    the unambiguous match — or ask the client to choose a tenant.
    """

    tenant_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    def validate(self, attrs):
        phone = attrs.get(self.username_field)
        password = attrs.get("password")
        tenant_id = attrs.get("tenant_id")

        qs = User.objects.filter(phone=phone, is_active=True).select_related("tenant")
        if tenant_id is not None:
            qs = qs.filter(tenant_id=tenant_id)

        candidates = list(qs)
        matches = [u for u in candidates if u.check_password(password)]

        if not matches:
            # Generic message — do not leak whether phone exists in any tenant.
            raise AuthenticationFailed(
                _("No active account found with the given credentials"),
                code="no_active_account",
            )

        if len(matches) > 1:
            raise MultiTenantLoginError(
                tenants=[
                    {"id": str(u.tenant_id), "name": u.tenant.name if u.tenant else None}
                    for u in matches
                    if u.tenant_id
                ]
            )

        user = matches[0]
        self.user = user
        refresh = self.get_token(user)

        if settings.SIMPLE_JWT.get("UPDATE_LAST_LOGIN"):
            update_last_login(None, user)

        display_name = build_display_name(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": str(user.id),
                "name": display_name,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "middle_name": user.middle_name,
                "phone": user.phone,
                "email": user.email,
                "role": user.role,
                "tenant_id": str(user.tenant_id) if user.tenant_id else None,
                "permissions": sorted(get_user_permissions(user)),
            },
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        display_name = build_display_name(user)
        token["tenant_id"] = str(user.tenant_id) if user.tenant_id else None
        token["role"] = user.role
        token["name"] = display_name
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["middle_name"] = user.middle_name
        return token
