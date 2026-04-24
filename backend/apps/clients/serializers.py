from django.db.models import F, Sum
from django.utils.translation import gettext as _
from rest_framework import serializers
import re

from debts.models import Debt
from sales.models import Sale
from sales.serializers import SaleItemReadSerializer

from .models import Client, Group


class ClientSerializer(serializers.ModelSerializer):
    PHONE_PATTERNS = (
        (re.compile(r"^\+998\d{9}$"), "+998901234567"),
        (re.compile(r"^\+7\d{10}$"), "+79991234567"),
        (re.compile(r"^\+1\d{10}$"), "+12025550123"),
    )

    @classmethod
    def normalize_phone(cls, value):
        return str(value or "").strip().replace(" ", "")

    @classmethod
    def is_supported_phone(cls, value):
        return any(pattern.fullmatch(value) for pattern, _example in cls.PHONE_PATTERNS)

    @classmethod
    def supported_phone_examples(cls):
        return ", ".join(example for _pattern, example in cls.PHONE_PATTERNS)

    phones = serializers.ListField(
        child=serializers.CharField(allow_blank=True, trim_whitespace=True),
        allow_empty=False,
    )
    addresses = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField(allow_blank=True, required=False)),
        required=False,
        allow_empty=True,
    )
    social_networks = serializers.DictField(
        child=serializers.CharField(allow_blank=True, required=False),
        required=False,
    )
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        phones = attrs.get("phones")
        if phones is None:
            fallback_phone = str(attrs.get("phone", "")).strip()
            if fallback_phone:
                phones = [fallback_phone]
        if phones is None and self.instance is not None:
            phones = self.instance.phones
        normalized_phones = [self.normalize_phone(phone) for phone in (phones or []) if self.normalize_phone(phone)]
        if not normalized_phones:
            raise serializers.ValidationError({"phones": _("At least one phone number is required.")})
        invalid_phones = [phone for phone in normalized_phones if not self.is_supported_phone(phone)]
        if invalid_phones:
            raise serializers.ValidationError(
                {
                    "phones": _(
                        "Unsupported phone format: %(phones)s. Use one of: %(examples)s."
                    ) % {
                        "phones": ", ".join(invalid_phones),
                        "examples": self.supported_phone_examples(),
                    }
                }
            )
        primary_phone = normalized_phones[0]
        tenant = self.context["request"].user.tenant
        duplicate_qs = Client.objects.filter(tenant=tenant, phone=primary_phone)
        if self.instance:
            duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)
        if duplicate_qs.exists():
            raise serializers.ValidationError(
                {"phones": _("Client with this phone number already exists.")}
            )

        attrs["phones"] = normalized_phones
        attrs["phone"] = primary_phone
        return attrs

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(_("Name is required."))
        return value

    def validate_phone(self, value):
        value = self.normalize_phone(value)
        if not self.is_supported_phone(value):
            raise serializers.ValidationError(
                _("Phone must match one of: %(examples)s.")
                % {"examples": self.supported_phone_examples()}
            )
        tenant = self.context["request"].user.tenant
        qs = Client.objects.filter(tenant=tenant, phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                _("Client with this phone number already exists.")
            )
        return value

    def validate_groups(self, value):
        request = self.context.get("request")
        if not request or not hasattr(request.user, "tenant"):
            return value

        tenant_id = request.user.tenant_id
        invalid = [group.id for group in value if group.tenant_id != tenant_id]
        if invalid:
            raise serializers.ValidationError(
                _("Some groups do not belong to your tenant: %(ids)s.")
                % {"ids": ", ".join(str(group_id) for group_id in invalid)}
            )
        return value

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        client = super().create(validated_data)
        if groups:
            client.groups.set(groups)
        return client

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        client = super().update(instance, validated_data)
        if groups is not None:
            client.groups.set(groups)
        return client

    class Meta:
        model = Client
        fields = (
            "id",
            "tenant",
            "name",
            "last_name",
            "middle_name",
            "birth_date",
            "gender",
            "marital_status",
            "phone",
            "phones",
            "addresses",
            "social_networks",
            "groups",
            "created_at",
        )
        read_only_fields = ("id", "tenant", "created_at")
        extra_kwargs = {
            "phone": {"required": False},
        }


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


class ClientBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )


class ClientBulkCreateExcelSerializer(serializers.Serializer):
    file = serializers.FileField()


class GroupBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )


class GroupListSerializer(serializers.ModelSerializer):
    clients_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = ("id", "tenant", "name", "description", "clients_count", "created_at")
        read_only_fields = ("id", "tenant", "clients_count", "created_at")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(_("Name is required."))
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        tenant = getattr(request.user, "tenant", None) if request else None
        if not tenant:
            return attrs

        name = attrs.get("name")
        if not name and self.instance is not None:
            name = self.instance.name
        if not name:
            return attrs

        qs = Group.objects.filter(tenant=tenant, name=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {"name": _("Group with this name already exists.")}
            )
        return attrs


class GroupDetailSerializer(serializers.ModelSerializer):
    clients_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = ("id", "tenant", "name", "description", "clients_count", "created_at")
        read_only_fields = fields
