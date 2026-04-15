from django.contrib.auth import password_validation
from django.db import transaction
from rest_framework import serializers

from .models import Tenant, User
from .phone import get_phone_rule, is_phone_valid, normalize_phone


class UserSerializer(serializers.ModelSerializer):
    tenant_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "phone", "email", "role", "tenant_id", "created_at")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    tenant_name = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    def validate_phone(self, value):
        phone = normalize_phone(value)
        rule = get_phone_rule()
        if not is_phone_valid(phone):
            raise serializers.ValidationError(
                f"Phone must match {rule.example} format."
            )
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("A user with this phone already exists.")
        return phone

    def validate_email(self, value):
        if value in ("", None):
            return None
        normalized = value.lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        tenant_name = validated_data.pop("tenant_name")

        with transaction.atomic():
            tenant = Tenant.objects.create(name=tenant_name)
            user = User.objects.create_user(
                phone=validated_data["phone"],
                email=validated_data.get("email"),
                password=validated_data["password"],
                name=validated_data["name"],
                tenant=tenant,
                role=User.Role.ADMIN,
            )
        return user
