from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import RolePermission, User
from .permission_catalog import DEFAULT_ROLE_PERMISSIONS, permission_key


def get_user_permissions(user):
    if not user.is_authenticated:
        return set()

    custom_permissions = set(
        RolePermission.objects.filter(
            tenant_id=user.tenant_id,
            role=user.role,
        ).values_list("permission", flat=True)
    )
    if custom_permissions:
        return custom_permissions
    return set(DEFAULT_ROLE_PERMISSIONS.get(user.role, []))


def has_user_permission(user, permission: str) -> bool:
    return permission in get_user_permissions(user)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and has_user_permission(
            request.user, permission_key("admin", "read")
        )


class IsManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return has_user_permission(request.user, permission_key("admin", "read")) or has_user_permission(
            request.user, permission_key("products", "read")
        )


class IsSellerOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return has_user_permission(request.user, permission_key("admin", "read")) or has_user_permission(
            request.user, permission_key("pos", "read")
        )


class HasPagePermission(BasePermission):
    page = ""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        action = "read" if request.method in SAFE_METHODS else "write"
        return has_user_permission(request.user, permission_key(self.page, action))


def page_permission(page: str):
    class _PagePermission(HasPagePermission):
        pass

    _PagePermission.page = page
    return _PagePermission


class HasSpecificPagePermission(BasePermission):
    page = ""
    action = "read"

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return has_user_permission(request.user, permission_key(self.page, self.action))


def page_action_permission(page: str, action: str):
    class _PageActionPermission(HasSpecificPagePermission):
        pass

    _PageActionPermission.page = page
    _PageActionPermission.action = action
    return _PageActionPermission
