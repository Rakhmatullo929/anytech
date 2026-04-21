from django.db import migrations, models


def fill_first_name_from_name(apps, schema_editor):
    User = apps.get_model("auth_tenant", "User")
    for user in User.objects.all().only("id", "name", "first_name"):
        if not user.first_name and user.name:
            user.first_name = user.name.strip()
            user.save(update_fields=["first_name"])


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenant", "0006_user_profile_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="first_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.RunPython(fill_first_name_from_name, migrations.RunPython.noop),
    ]
