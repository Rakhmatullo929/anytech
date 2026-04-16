from django.db import migrations, models


def populate_phones(apps, schema_editor):
    Client = apps.get_model("clients", "Client")
    for client in Client.objects.all().only("id", "phone", "phones"):
        current_phone = (client.phone or "").strip()
        client.phones = [current_phone] if current_phone else []
        client.save(update_fields=["phones"])


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0002_client_clients_tenant__fb2654_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="client",
            name="addresses",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="client",
            name="birth_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="client",
            name="communication_language",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="client",
            name="gender",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="client",
            name="last_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="client",
            name="marital_status",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="client",
            name="middle_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="client",
            name="phones",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="client",
            name="social_networks",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(code=populate_phones, reverse_code=migrations.RunPython.noop),
    ]
