from django.contrib.auth import password_validation
from django.db import transaction
from rest_framework import serializers

from .models import Tenant, User
from .phone import get_phone_rule, is_phone_valid, normalize_phone


def normalize_passport_series(value):
    if value in ("", None):
        return None
    return str(value).strip().upper()


def validate_passport_series(value):
    normalized = normalize_passport_series(value)
    if normalized is None:
        return None
    if not (len(normalized) == 9 and normalized[:2].isalpha() and normalized[2:].isdigit()):
        raise serializers.ValidationError("Passport series must match AB1234567 format.")
    return normalized


class UserSerializer(serializers.ModelSerializer):
    tenant_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "phone", "email", "passport_series", "gender", "role", "tenant_id", "created_at")
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


class ImpersonateSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()

    def validate(self, attrs):
        request = self.context["request"]
        target_user = User.objects.filter(
            id=attrs["user_id"],
            tenant_id=request.user.tenant_id,
        ).first()

        if target_user is None:
            raise serializers.ValidationError({"user_id": "User not found in your tenant."})

        attrs["target_user"] = target_user
        return attrs


class TenantUserCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    passport_series = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=9)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_null=True)
    role = serializers.ChoiceField(choices=User.Role.choices)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    def validate_phone(self, value):
        phone = normalize_phone(value)
        rule = get_phone_rule()
        if not is_phone_valid(phone):
            raise serializers.ValidationError(f"Phone must match {rule.example} format.")
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

    def validate_passport_series(self, value):
        return validate_passport_series(value)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data.pop("password_confirm")
        return User.objects.create_user(
            phone=validated_data["phone"],
            email=validated_data.get("email"),
            passport_series=validated_data.get("passport_series"),
            gender=validated_data.get("gender"),
            password=validated_data["password"],
            name=validated_data["name"],
            tenant=request.user.tenant,
            role=validated_data["role"],
        )


class TenantUserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    passport_series = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=9)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_null=True)
    role = serializers.ChoiceField(choices=User.Role.choices)
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    password_confirm = serializers.CharField(
        write_only=True, min_length=6, required=False, allow_blank=True
    )

    def validate_phone(self, value):
        phone = normalize_phone(value)
        rule = get_phone_rule()
        if not is_phone_valid(phone):
            raise serializers.ValidationError(f"Phone must match {rule.example} format.")

        qs = User.objects.filter(phone=phone)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this phone already exists.")
        return phone

    def validate_email(self, value):
        if value in ("", None):
            return None
        normalized = value.lower()
        qs = User.objects.filter(email__iexact=normalized)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate_passport_series(self, value):
        return validate_passport_series(value)

    def validate(self, attrs):
        password = attrs.get("password") or ""
        password_confirm = attrs.get("password_confirm") or ""

        if password or password_confirm:
            if password != password_confirm:
                raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
            password_validation.validate_password(password, user=self.instance)

        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        validated_data.pop("password_confirm", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)
            instance.save()
            return instance

        instance.save(update_fields=["name", "phone", "email", "passport_series", "gender", "role"])
        return instance
