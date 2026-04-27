import uuid

from django.db import migrations, models


def migrate_product_image_to_product_images(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    ProductImage = apps.get_model("products", "ProductImage")

    to_create = []
    for product in Product.objects.exclude(image="").exclude(image__isnull=True).iterator():
        to_create.append(
            ProductImage(
                id=uuid.uuid4(),
                product_id=product.id,
                image=product.image,
                position=0,
            )
        )
    if to_create:
        ProductImage.objects.bulk_create(to_create)


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0003_remove_product_pricing_stock_add_image"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductImage",
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
                ("image", models.ImageField(upload_to="products/")),
                ("position", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="images",
                        to="products.product",
                    ),
                ),
            ],
            options={
                "db_table": "product_images",
                "ordering": ["position", "created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="productimage",
            index=models.Index(
                fields=["product", "position"], name="product_ima_product_8c4733_idx"
            ),
        ),
        migrations.RunPython(
            migrate_product_image_to_product_images, migrations.RunPython.noop
        ),
        migrations.RemoveField(
            model_name="product",
            name="image",
        ),
    ]
