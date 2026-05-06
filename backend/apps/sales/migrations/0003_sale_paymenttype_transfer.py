from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0002_saleitem_cost'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sale',
            name='payment_type',
            field=models.CharField(
                choices=[
                    ('cash', 'Cash'),
                    ('card', 'Card'),
                    ('transfer', 'Transfer'),
                    ('debt', 'Debt'),
                ],
                max_length=10,
            ),
        ),
    ]
