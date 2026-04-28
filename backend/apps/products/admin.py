from django.contrib import admin

from .models import Category, Product, ProductImage, ProductPurchase


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "position", "created_at")
    readonly_fields = ("created_at",)


class ProductPurchaseInline(admin.TabularInline):
    model = ProductPurchase
    extra = 1
    fields = ("quantity", "unit_price", "currency", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "tenant", "created_at")
    list_filter = ("tenant",)
    search_fields = ("name", "sku")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = (ProductImageInline, ProductPurchaseInline)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "tenant", "created_at")
    list_filter = ("tenant",)
    search_fields = ("name",)
    readonly_fields = ("id", "created_at", "updated_at")
