from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0005_group"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="client",
            name="communication_language",
        ),
    ]
