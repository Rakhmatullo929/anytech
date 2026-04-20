from django.utils.translation import gettext as _
from rest_framework import serializers

from .models import Debt, Payment


# ── Read serializers ───────────────────────────────────────────────────


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "amount", "created_at")
        read_only_fields = ("id", "created_at")


class DebtListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    remaining = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = Debt
        fields = (
            "id", "client", "client_name", "sale",
            "total_amount", "paid_amount", "remaining",
            "status", "created_at",
        )


class DebtDetailSerializer(DebtListSerializer):
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta(DebtListSerializer.Meta):
        fields = DebtListSerializer.Meta.fields + ("updated_at", "payments")


# ── Write serializer (input for pay action) ───────────────────────────


class PaymentCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(_("Amount must be greater than zero."))
        return value
