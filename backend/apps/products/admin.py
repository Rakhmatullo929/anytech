from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "sale_price", "purchase_price", "stock", "tenant", "created_at")
    list_filter = ("tenant",)
    search_fields = ("name", "sku")
    readonly_fields = ("id", "created_at", "updated_at")
