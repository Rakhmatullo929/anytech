from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0002_product_products_tenant__954819_idx_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="product",
            name="purchase_price",
        ),
        migrations.RemoveField(
            model_name="product",
            name="sale_price",
        ),
        migrations.RemoveField(
            model_name="product",
            name="stock",
        ),
        migrations.AddField(
            model_name="product",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="products/"),
        ),
    ]
