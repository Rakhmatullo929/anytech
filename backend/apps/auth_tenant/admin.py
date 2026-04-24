from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import District, Region, RolePermission, Tenant, TenantRole, User


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "created_at")
    search_fields = ("name",)
    readonly_fields = ("id", "created_at")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("phone", "email", "first_name", "last_name", "role", "tenant", "is_active", "created_at")
    list_filter = ("role", "is_active", "tenant")
    search_fields = ("phone", "email", "first_name", "last_name", "middle_name")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "middle_name", "birth_date", "region", "district", "tenant", "role", "email")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser")}),
        (_("Meta"), {"fields": ("id", "created_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone", "first_name", "last_name", "middle_name", "birth_date", "region", "district", "tenant", "role", "email", "password1", "password2"),
        }),
    )


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("name_uz", "name_ru", "code")
    search_fields = ("name_uz", "name_ru", "code")


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name_uz", "name_ru", "code", "region")
    search_fields = ("name_uz", "name_ru", "code")
    list_filter = ("region",)


@admin.register(TenantRole)
class TenantRoleAdmin(admin.ModelAdmin):
    list_display = ("tenant", "code", "name", "is_system", "created_at")
    search_fields = ("tenant__name", "code", "name")
    list_filter = ("is_system", "tenant")


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("tenant", "role", "permission", "created_at")
    search_fields = ("tenant__name", "role", "permission")
    list_filter = ("tenant", "role")
