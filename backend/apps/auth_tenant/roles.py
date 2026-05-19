from django.db import transaction

from .models import RolePermission, TenantRole, User
from .permission_catalog import DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLE_DEFINITIONS


def ensure_tenant_roles(tenant):
    if tenant is None:
        return

    existing_codes = set(tenant.roles.values_list("code", flat=True))
    to_create = []
    for code, label in SYSTEM_ROLE_DEFINITIONS:
        if code in existing_codes:
            continue
        to_create.append(TenantRole(tenant=tenant, code=code, name=label, is_system=True))
    if to_create:
        TenantRole.objects.bulk_create(to_create)


@transaction.atomic
def create_tenant_role(*, tenant, code: str, name: str):
    role = TenantRole.objects.create(tenant=tenant, code=code, name=name, is_system=False)
    return role


@transaction.atomic
def delete_tenant_role(*, tenant, code: str):
    role = TenantRole.objects.filter(tenant=tenant, code=code).first()
    if role is None:
        return False
    if role.is_system:
        raise ValueError("Cannot delete system role.")
    if User.objects.filter(tenant=tenant, role=code).exists():
        raise ValueError("Cannot delete role assigned to users.")
    RolePermission.objects.filter(tenant=tenant, role=code).delete()
    role.delete()
    return True
