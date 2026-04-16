from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0003_client_profile_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="client",
            name="communication_language",
            field=models.CharField(
                blank=True,
                choices=[("uz", "Uzbek"), ("ru", "Russian"), ("en", "English")],
                default="",
                max_length=8,
            ),
        ),
    ]
