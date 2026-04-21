from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenant", "0005_rolepermission"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="birth_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="last_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="middle_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
