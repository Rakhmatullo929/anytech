import django.db.models.deletion
import uuid
from django.db import migrations, models


def seed_tenant_roles(apps, schema_editor):
    Tenant = apps.get_model("auth_tenant", "Tenant")
    User = apps.get_model("auth_tenant", "User")
    RolePermission = apps.get_model("auth_tenant", "RolePermission")
    TenantRole = apps.get_model("auth_tenant", "TenantRole")

    system_roles = {
        "admin": "Admin",
        "manager": "Manager",
        "seller": "Seller",
    }

    for tenant in Tenant.objects.all():
        existing_codes = set(TenantRole.objects.filter(tenant=tenant).values_list("code", flat=True))
        dynamic_codes = set(
            User.objects.filter(tenant=tenant).exclude(role__isnull=True).exclude(role="").values_list("role", flat=True)
        )
        dynamic_codes.update(
            RolePermission.objects.filter(tenant=tenant)
            .exclude(role__isnull=True)
            .exclude(role="")
            .values_list("role", flat=True)
        )

        for code, label in system_roles.items():
            if code in existing_codes:
                continue
            TenantRole.objects.create(tenant=tenant, code=code, name=label, is_system=True)
            existing_codes.add(code)

        for code in sorted(dynamic_codes):
            if code in existing_codes:
                continue
            TenantRole.objects.create(tenant=tenant, code=code, name=code.replace("-", " ").title(), is_system=False)


class Migration(migrations.Migration):
    dependencies = [
        ("auth_tenant", "0011_alter_district_id_alter_region_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantRole",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("code", models.SlugField(max_length=64)),
                ("name", models.CharField(max_length=255)),
                ("is_system", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tenant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="roles",
                        to="auth_tenant.tenant",
                    ),
                ),
            ],
            options={
                "db_table": "tenant_roles",
                "ordering": ("created_at",),
                "unique_together": {("tenant", "code")},
            },
        ),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(default="seller", max_length=64),
        ),
        migrations.AlterField(
            model_name="rolepermission",
            name="role",
            field=models.CharField(max_length=64),
        ),
        migrations.RunPython(seed_tenant_roles, migrations.RunPython.noop),
    ]
