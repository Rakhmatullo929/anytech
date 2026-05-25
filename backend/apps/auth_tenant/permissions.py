from django.core.cache import cache
from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import RolePermission
from .permission_catalog import DEFAULT_ROLE_PERMISSIONS, permission_key

_PERMISSIONS_CACHE_ATTR = "_cached_permissions"

# Process-level cache key namespace. Resolved permissions for a (tenant, role)
# rarely change but are read on every authenticated request — caching them in
# Redis (production) / LocMem (dev/test) eliminates a per-request SELECT from
# role_permissions. Invalidation: post_save/post_delete signal on RolePermission
# (see signals.py) plus an explicit cache.delete in the update serializer.
_PERMS_CACHE_PREFIX = "auth:perms:v1"
_PERMS_CACHE_TTL = 60 * 60  # 1 hour — signal-driven invalidation makes this a safety net.


def role_permissions_cache_key(tenant_id, role: str) -> str:
    """Key for the resolved-permissions cache. tenant_id may be None for
    superusers / orphan users; encode as "_" so the key remains valid."""
    tid = tenant_id if tenant_id is not None else "_"
    return f"{_PERMS_CACHE_PREFIX}:{tid}:{role}"


def invalidate_role_permissions_cache(tenant_id, role: str) -> None:
    cache.delete(role_permissions_cache_key(tenant_id, role))


def get_user_permissions(user):
    if not user.is_authenticated:
        return set()

    # Layer 1: per-request cache on the user instance — avoids even a cache.get
    # round-trip when multiple permission classes evaluate within one request.
    cached = getattr(user, _PERMISSIONS_CACHE_ATTR, None)
    if cached is not None:
        return cached

    # Layer 2: process/Redis cache, shared across requests and workers.
    cache_key = role_permissions_cache_key(user.tenant_id, user.role)
    cached_perms = cache.get(cache_key)
    if cached_perms is not None:
        resolved_permissions = set(cached_perms)
        setattr(user, _PERMISSIONS_CACHE_ATTR, resolved_permissions)
        return resolved_permissions

    custom_permissions = set(
        RolePermission.objects.filter(
            tenant_id=user.tenant_id,
            role=user.role,
        ).values_list("permission", flat=True)
    )
    resolved_permissions = custom_permissions or set(DEFAULT_ROLE_PERMISSIONS.get(user.role, []))
    # Store as a sorted tuple so the serialized payload is deterministic across
    # workers — useful for debugging and avoids spurious cache churn.
    cache.set(cache_key, tuple(sorted(resolved_permissions)), _PERMS_CACHE_TTL)
    setattr(user, _PERMISSIONS_CACHE_ATTR, resolved_permissions)
    return resolved_permissions


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
        permissions = get_user_permissions(request.user)
        return permission_key("admin", "read") in permissions or permission_key("products", "read") in permissions


class IsSellerOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        permissions = get_user_permissions(request.user)
        return permission_key("admin", "read") in permissions or permission_key("pos", "read") in permissions


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
