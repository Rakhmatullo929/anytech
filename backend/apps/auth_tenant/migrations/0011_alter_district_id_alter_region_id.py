# See 0010 — no-op companion. Final state for Region.id and District.id
# is the UUIDField introduced in 0009.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auth_tenant', '0010_alter_district_id_alter_region_id'),
    ]

    operations = []
