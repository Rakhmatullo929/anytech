import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth_tenant', '0013_add_reports_read_permission'),
    ]

    operations = [
        migrations.CreateModel(
            name='CashRegister',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('status', models.CharField(
                    choices=[('open', 'Open'), ('closed', 'Closed')],
                    default='closed',
                    max_length=10,
                )),
                ('opened_at', models.DateTimeField(blank=True, null=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('tenant', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='cash_register',
                    to='auth_tenant.tenant',
                )),
                ('opened_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='opened_cash_registers',
                    to='auth_tenant.user',
                )),
                ('closed_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='closed_cash_registers',
                    to='auth_tenant.user',
                )),
            ],
            options={
                'db_table': 'cash_registers',
            },
        ),
    ]
