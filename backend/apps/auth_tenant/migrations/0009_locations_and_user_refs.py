import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenant", "0008_remove_user_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="Region",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name_uz", models.CharField(max_length=255)),
                ("name_ru", models.CharField(max_length=255)),
                ("code", models.CharField(max_length=32, unique=True)),
            ],
            options={
                "db_table": "regions",
                "ordering": ("name_uz",),
            },
        ),
        migrations.CreateModel(
            name="District",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name_uz", models.CharField(max_length=255)),
                ("name_ru", models.CharField(max_length=255)),
                ("code", models.CharField(max_length=32, unique=True)),
                (
                    "region",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="districts", to="auth_tenant.region"),
                ),
            ],
            options={
                "db_table": "districts",
                "ordering": ("name_uz",),
            },
        ),
        migrations.AddField(
            model_name="user",
            name="district",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="users", to="auth_tenant.district"),
        ),
        migrations.AddField(
            model_name="user",
            name="region",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="users", to="auth_tenant.region"),
        ),
    ]
