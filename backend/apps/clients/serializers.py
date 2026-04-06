from django.db.models import F, Sum
from rest_framework import serializers

from debts.models import Debt
from sales.models import Sale
from sales.serializers import SaleItemReadSerializer

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_phone(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Phone number is required.")

        tenant = self.context["request"].user.tenant
        qs = Client.objects.filter(tenant=tenant, phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Client with this phone number already exists."
            )
        return value

    class Meta:
        model = Client
        fields = ("id", "tenant", "name", "phone", "created_at")
        read_only_fields = ("id", "tenant", "created_at")


# ── Inline serializers for client detail (purchase history) ──────────


class DebtInlineSerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = Debt
        fields = ("total_amount", "paid_amount", "remaining", "status")


class SaleInlineSerializer(serializers.ModelSerializer):
    items = SaleItemReadSerializer(many=True, read_only=True)
    debt = DebtInlineSerializer(read_only=True, allow_null=True, default=None)

    class Meta:
        model = Sale
        fields = ("id", "total_amount", "payment_type", "created_at", "items", "debt")


class ClientDetailSerializer(ClientSerializer):
    sales = SaleInlineSerializer(many=True, read_only=True)
    total_debt = serializers.SerializerMethodField()

    def get_total_debt(self, obj):
        result = obj.debts.filter(status=Debt.Status.ACTIVE).aggregate(
            total=Sum(F("total_amount") - F("paid_amount"))
        )
        return result["total"] or 0

    class Meta(ClientSerializer.Meta):
        fields = ClientSerializer.Meta.fields + ("sales", "total_debt")
