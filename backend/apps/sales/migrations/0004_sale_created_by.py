import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0003_sale_paymenttype_transfer'),
        ('auth_tenant', '0012_dynamic_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='sale',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_sales',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
