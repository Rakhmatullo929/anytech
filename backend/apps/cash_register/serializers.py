from rest_framework import serializers

from .models import CashRegister


class CashRegisterSerializer(serializers.ModelSerializer):
    opened_by_name = serializers.SerializerMethodField()
    closed_by_name = serializers.SerializerMethodField()

    def get_opened_by_name(self, obj):
        u = obj.opened_by
        if not u:
            return None
        return " ".join(filter(None, [u.first_name, getattr(u, "last_name", "") or ""])) or None

    def get_closed_by_name(self, obj):
        u = obj.closed_by
        if not u:
            return None
        return " ".join(filter(None, [u.first_name, getattr(u, "last_name", "") or ""])) or None

    class Meta:
        model = CashRegister
        fields = (
            "id",
            "status",
            "opened_at",
            "closed_at",
            "opened_by",
            "opened_by_name",
            "closed_by",
            "closed_by_name",
        )
        read_only_fields = fields
