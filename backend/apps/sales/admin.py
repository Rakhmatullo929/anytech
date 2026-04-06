from django.contrib import admin

from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ("id",)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "total_amount", "payment_type", "tenant", "created_at")
    list_filter = ("tenant", "payment_type")
    search_fields = ("client__name",)
    readonly_fields = ("id", "created_at")
    inlines = [SaleItemInline]
