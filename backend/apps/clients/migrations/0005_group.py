import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0004_alter_client_communication_language"),
    ]

    operations = [
        migrations.CreateModel(
            name="Group",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tenant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_groups",
                        to="auth_tenant.tenant",
                    ),
                ),
                (
                    "clients",
                    models.ManyToManyField(
                        blank=True,
                        db_table="clients_groups",
                        related_name="groups",
                        to="clients.client",
                    ),
                ),
            ],
            options={
                "db_table": "client_groups",
                "indexes": [models.Index(fields=["tenant", "-created_at"], name="client_grou_tenant__3d7f55_idx")],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("tenant", "name"), name="unique_group_name_per_tenant"
                    )
                ],
            },
        ),
    ]
