from django.db import migrations


def add_sales_write_to_seller_roles(apps, schema_editor):
    """
    Any tenant that has customised seller-role permissions (RolePermission rows)
    and already has pos:write gets sales:write added, because sellers create
    sales via POS and the POST /api/v1/sales/ endpoint requires sales:write.
    """
    RolePermission = apps.get_model("auth_tenant", "RolePermission")

    qualified = (
        RolePermission.objects.filter(role="seller", permission="pos:write")
        .values("tenant_id", "role")
        .distinct()
    )

    to_create = []
    for entry in qualified:
        already_has = RolePermission.objects.filter(
            tenant_id=entry["tenant_id"],
            role=entry["role"],
            permission="sales:write",
        ).exists()
        if not already_has:
            to_create.append(
                RolePermission(
                    tenant_id=entry["tenant_id"],
                    role=entry["role"],
                    permission="sales:write",
                )
            )

    if to_create:
        RolePermission.objects.bulk_create(to_create, ignore_conflicts=True)


def remove_sales_write_from_seller_roles(apps, schema_editor):
    RolePermission = apps.get_model("auth_tenant", "RolePermission")
    RolePermission.objects.filter(role="seller", permission="sales:write").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenant", "0013_add_reports_read_permission"),
    ]

    operations = [
        migrations.RunPython(
            add_sales_write_to_seller_roles,
            remove_sales_write_from_seller_roles,
        ),
    ]
