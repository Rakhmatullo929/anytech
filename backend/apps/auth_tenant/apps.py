from django.apps import AppConfig


class AuthTenantConfig(AppConfig):
    name = "auth_tenant"

    def ready(self):
        # Side effect: registers post_save/post_delete receivers that invalidate
        # the role-permissions cache. Import-only, no return value.
        from . import signals  # noqa: F401
