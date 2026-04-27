import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("auth_tenant", "0001_initial"),
        ("products", "0004_product_images"),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tenant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="categories",
                        to="auth_tenant.tenant",
                    ),
                ),
            ],
            options={
                "db_table": "categories",
            },
        ),
        migrations.AddField(
            model_name="product",
            name="category",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="products",
                to="products.category",
            ),
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(
                fields=["tenant", "-created_at"], name="categories_tenant__f6a318_idx"
            ),
        ),
        migrations.AddConstraint(
            model_name="category",
            constraint=models.UniqueConstraint(
                fields=("tenant", "name"), name="unique_category_name_per_tenant"
            ),
        ),
    ]
