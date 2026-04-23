from django.db.models import F, Sum
from django.utils.translation import gettext as _
from rest_framework import serializers
import re

from debts.models import Debt
from sales.models import Sale
from sales.serializers import SaleItemReadSerializer

from .models import Client, Group


class GroupSerializer(serializers.ModelSerializer):
    client_count = serializers.IntegerField(read_only=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        if not request or not hasattr(request.user, "tenant"):
            return attrs

        tenant = request.user.tenant
        name = attrs.get("name", getattr(self.instance, "name", "")).strip()
        duplicate_qs = Group.objects.filter(tenant=tenant, name=name)
        if self.instance:
            duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)
        if duplicate_qs.exists():
            raise serializers.ValidationError({"name": _("Group with this name already exists.")})
        attrs["name"] = name
        return attrs

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(_("Name is required."))
        return value

    class Meta:
        model = Group
        fields = (
            "id",
            "tenant",
            "name",
            "description",
            "client_count",
            "created_at",
        )
        read_only_fields = ("id", "tenant", "client_count", "created_at")


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

    communication_language = serializers.ChoiceField(
        choices=Client.CommunicationLanguage.choices,
        required=False,
        allow_blank=True,
    )
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
        queryset=Group.objects.none(),
        required=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and hasattr(request.user, "tenant"):
            self.fields["groups"].queryset = Group.objects.filter(tenant=request.user.tenant)

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

    class Meta:
        model = Client
        fields = (
            "id",
            "tenant",
            "name",
            "last_name",
            "middle_name",
            "birth_date",
            "communication_language",
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
