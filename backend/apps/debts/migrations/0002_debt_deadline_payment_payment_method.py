from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('debts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='debt',
            name='deadline',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='payment_method',
            field=models.CharField(
                choices=[('cash', 'Cash'), ('card', 'Card'), ('transfer', 'Transfer')],
                default='cash',
                max_length=10,
            ),
        ),
    ]
