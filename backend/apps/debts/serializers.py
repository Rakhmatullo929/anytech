from django.utils.translation import gettext as _
from rest_framework import serializers

from .models import Debt, Payment


# ── Read serializers ───────────────────────────────────────────────────


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "amount", "payment_method", "created_at")
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
            "status", "deadline", "created_at",
        )


class DebtDetailSerializer(DebtListSerializer):
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta(DebtListSerializer.Meta):
        fields = DebtListSerializer.Meta.fields + ("updated_at", "payments")


class DebtPaymentListSerializer(serializers.ModelSerializer):
    debt_id = serializers.UUIDField(read_only=True)
    customer_id = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    cashier_id = serializers.UUIDField(read_only=True, allow_null=True)
    cashier_name = serializers.SerializerMethodField()

    def get_customer_id(self, obj):
        return str(obj.debt.client_id) if obj.debt.client_id else None

    def get_customer_name(self, obj):
        client = obj.debt.client
        return client.name if client else None

    def get_cashier_name(self, obj):
        u = obj.cashier
        if not u:
            return None
        return " ".join(filter(None, [u.first_name, u.last_name])) or None

    class Meta:
        model = Payment
        fields = (
            "id",
            "debt_id",
            "customer_id",
            "customer_name",
            "amount",
            "payment_method",
            "created_at",
            "cashier_id",
            "cashier_name",
        )


# ── Write serializer (input for pay action) ───────────────────────────


class PaymentCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices,
        default=Payment.PaymentMethod.CASH,
    )

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(_("Amount must be greater than zero."))
        return value
