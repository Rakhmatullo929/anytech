from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenant", "0007_user_first_name"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="name",
        ),
    ]
