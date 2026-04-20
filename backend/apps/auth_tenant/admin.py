from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Tenant, User


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "created_at")
    search_fields = ("name",)
    readonly_fields = ("id", "created_at")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("phone", "email", "name", "role", "tenant", "is_active", "created_at")
    list_filter = ("role", "is_active", "tenant")
    search_fields = ("phone", "email", "name")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        (_("Personal info"), {"fields": ("name", "tenant", "role", "email")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser")}),
        (_("Meta"), {"fields": ("id", "created_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone", "name", "tenant", "role", "email", "password1", "password2"),
        }),
    )
