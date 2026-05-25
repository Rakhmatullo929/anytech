from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import RolePermission
from .permissions import invalidate_role_permissions_cache


@receiver(post_save, sender=RolePermission)
@receiver(post_delete, sender=RolePermission)
def _invalidate_role_permissions_cache(sender, instance, **kwargs):
    """Drop the cached (tenant, role) permission set whenever a RolePermission
    row is written or removed. Covers all runtime mutation paths (serializer,
    Django admin, ad-hoc scripts) — without this, callers must remember to
    invalidate manually."""
    invalidate_role_permissions_cache(instance.tenant_id, instance.role)
