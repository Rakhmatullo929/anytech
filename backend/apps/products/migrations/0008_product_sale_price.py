from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0007_rename_product_pur_product_0cae64_idx_product_pur_product_012bc9_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="sale_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(
                condition=models.Q(sale_price__gte=0),
                name="product_sale_price_gte_zero",
            ),
        ),
    ]
