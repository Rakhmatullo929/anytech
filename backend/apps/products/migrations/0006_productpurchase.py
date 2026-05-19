import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0005_category_and_product_category"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductPurchase",
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
                ("quantity", models.PositiveIntegerField()),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="purchases",
                        to="products.product",
                    ),
                ),
            ],
            options={
                "db_table": "product_purchases",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="productpurchase",
            index=models.Index(
                fields=["product", "-created_at"],
                name="product_pur_product_0cae64_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="productpurchase",
            constraint=models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="product_purchase_quantity_gt_zero",
            ),
        ),
        migrations.AddConstraint(
            model_name="productpurchase",
            constraint=models.CheckConstraint(
                condition=models.Q(unit_price__gte=0),
                name="product_purchase_unit_price_gte_zero",
            ),
        ),
    ]
