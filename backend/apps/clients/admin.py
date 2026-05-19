from django.contrib import admin

from .models import Client, Group


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("name", "tenant", "created_at")
    list_filter = ("tenant",)
    search_fields = ("name",)
    readonly_fields = ("id", "created_at")
    filter_horizontal = ("clients",)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "tenant", "created_at")
    list_filter = ("tenant",)
    search_fields = ("name", "phone")
    readonly_fields = ("id", "created_at")
