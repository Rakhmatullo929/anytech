# 0010 + 0011 originally bounced Region.id and District.id between
# UUID -> BigAutoField -> UUID. Net effect is identity, but on Postgres
# the first AlterField fails with "cannot cast type uuid to bigint".
# Both migrations are kept (so existing django_migrations rows stay valid)
# but reduced to no-ops. Final state matches what 0009 created (UUID).

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auth_tenant', '0009_locations_and_user_refs'),
    ]

    operations = []
