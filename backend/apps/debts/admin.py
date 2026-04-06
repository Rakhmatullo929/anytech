from django.contrib import admin

from .models import Debt, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("id", "created_at")


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "total_amount", "paid_amount", "status", "tenant", "created_at")
    list_filter = ("tenant", "status")
    search_fields = ("client__name",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [PaymentInline]
