from django.db import migrations


def add_reports_read_to_custom_roles(apps, schema_editor):
    """
    Any tenant that has customized role permissions (RolePermission rows) for a role
    that includes 'sales:read' also gets 'reports:read' added, since reports access
    is at the same level as sales read access.
    """
    RolePermission = apps.get_model("auth_tenant", "RolePermission")

    # Find all (tenant_id, role) pairs that have custom permissions with 'sales:read'
    qualified = (
        RolePermission.objects.filter(permission="sales:read")
        .values("tenant_id", "role")
        .distinct()
    )

    to_create = []
    for entry in qualified:
        already_has = RolePermission.objects.filter(
            tenant_id=entry["tenant_id"],
            role=entry["role"],
            permission="reports:read",
        ).exists()
        if not already_has:
            to_create.append(
                RolePermission(
                    tenant_id=entry["tenant_id"],
                    role=entry["role"],
                    permission="reports:read",
                )
            )

    if to_create:
        RolePermission.objects.bulk_create(to_create, ignore_conflicts=True)


def remove_reports_read_from_custom_roles(apps, schema_editor):
    RolePermission = apps.get_model("auth_tenant", "RolePermission")
    RolePermission.objects.filter(permission="reports:read").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenant", "0012_dynamic_roles"),
    ]

    operations = [
        migrations.RunPython(
            add_reports_read_to_custom_roles,
            remove_reports_read_from_custom_roles,
        ),
    ]
