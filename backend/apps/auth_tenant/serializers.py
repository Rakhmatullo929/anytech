from django.contrib.auth import password_validation
from django.db import transaction
from rest_framework import serializers

from .models import Tenant, User


class UserSerializer(serializers.ModelSerializer):
    tenant_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "email", "role", "tenant_id", "created_at")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    tenant_name = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

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
                email=validated_data["email"],
                password=validated_data["password"],
                name=validated_data["name"],
                tenant=tenant,
                role=User.Role.ADMIN,
            )
        return user
