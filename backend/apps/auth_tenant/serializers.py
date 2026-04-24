from django.contrib.auth import password_validation
from django.db import transaction
from django.utils.text import slugify
from django.utils.translation import gettext as _
from rest_framework import serializers

from .models import District, Region, RolePermission, Tenant, TenantRole, User
from .permission_catalog import ADMIN_REQUIRED_PERMISSIONS, ALL_PERMISSIONS
from .roles import ensure_tenant_roles
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
        raise serializers.ValidationError(_("Passport series must match AB1234567 format."))
    return normalized


class UserSerializer(serializers.ModelSerializer):
    tenant_id = serializers.UUIDField(read_only=True)
    region = serializers.SerializerMethodField()
    district = serializers.SerializerMethodField()
    region_id = serializers.UUIDField(read_only=True)
    district_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "middle_name",
            "birth_date",
            "phone",
            "email",
            "passport_series",
            "gender",
            "role",
            "region",
            "district",
            "region_id",
            "district_id",
            "tenant_id",
            "created_at",
        )
        read_only_fields = fields

    def get_region(self, obj):
        if not obj.region_id:
            return None
        return RegionSerializer(obj.region).data

    def get_district(self, obj):
        if not obj.district_id:
            return None
        return DistrictSerializer(obj.district).data


class RegionSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = ("id", "name", "code")
        read_only_fields = fields

    def get_name(self, obj):
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", "uz") if request else "uz"
        return obj.name_ru if lang == "ru" else obj.name_uz


class DistrictSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = District
        fields = ("id", "region_id", "name", "code")
        read_only_fields = fields

    def get_name(self, obj):
        request = self.context.get("request")
        lang = getattr(request, "LANGUAGE_CODE", "uz") if request else "uz"
        return obj.name_ru if lang == "ru" else obj.name_uz


class RegisterSerializer(serializers.Serializer):
    tenant_name = serializers.CharField(max_length=255)
    first_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    def validate_phone(self, value):
        phone = normalize_phone(value)
        rule = get_phone_rule()
        if not is_phone_valid(phone):
            raise serializers.ValidationError(
                _("Phone must match %(example)s format.") % {"example": rule.example}
            )
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(_("A user with this phone already exists."))
        return phone

    def validate_email(self, value):
        if value in ("", None):
            return None
        normalized = value.lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(_("A user with this email already exists."))
        return normalized

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": _("Passwords do not match.")}
            )
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        tenant_name = validated_data.pop("tenant_name")

        with transaction.atomic():
            tenant = Tenant.objects.create(name=tenant_name)
            ensure_tenant_roles(tenant)
            user = User.objects.create_user(
                phone=validated_data["phone"],
                email=validated_data.get("email"),
                password=validated_data["password"],
                first_name=validated_data["first_name"],
                tenant=tenant,
                role="admin",
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
            raise serializers.ValidationError({"user_id": _("User not found in your tenant.")})

        attrs["target_user"] = target_user
        return attrs


class TenantUserCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    middle_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    birth_date = serializers.DateField(required=True)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    passport_series = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=9)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_null=True)
    role = serializers.CharField(max_length=64)
    region_id = serializers.UUIDField(required=True, allow_null=False)
    district_id = serializers.UUIDField(required=True, allow_null=False)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    def validate_phone(self, value):
        phone = normalize_phone(value)
        rule = get_phone_rule()
        if not is_phone_valid(phone):
            raise serializers.ValidationError(
                _("Phone must match %(example)s format.") % {"example": rule.example}
            )
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(_("A user with this phone already exists."))
        return phone

    def validate_email(self, value):
        if value in ("", None):
            return None
        normalized = value.lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError(_("A user with this email already exists."))
        return normalized

    def validate_passport_series(self, value):
        return validate_passport_series(value)

    def validate_role(self, value):
        request = self.context["request"]
        ensure_tenant_roles(request.user.tenant)
        role = TenantRole.objects.filter(tenant=request.user.tenant, code=value).first()
        if role is None:
            raise serializers.ValidationError(_("Role not found in your tenant."))
        return value

    def validate(self, attrs):
        region_id = attrs.get("region_id")
        district_id = attrs.get("district_id")
        region = Region.objects.filter(id=region_id).first() if region_id else None
        district = District.objects.filter(id=district_id).select_related("region").first() if district_id else None
        if district and region and district.region_id != region.id:
            raise serializers.ValidationError({"district_id": _("District does not belong to selected region.")})
        if district and not region:
            region = district.region
        attrs["region"] = region
        attrs["district"] = district
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": _("Passwords do not match.")})
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
            first_name=validated_data["first_name"],
            last_name=validated_data.get("last_name", ""),
            middle_name=validated_data.get("middle_name", ""),
            birth_date=validated_data["birth_date"],
            region=validated_data.get("region"),
            district=validated_data.get("district"),
            tenant=request.user.tenant,
            role=validated_data["role"],
        )


class TenantUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    middle_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    birth_date = serializers.DateField(required=True)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    passport_series = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=9)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False, allow_null=True)
    role = serializers.CharField(max_length=64)
    region_id = serializers.UUIDField(required=True, allow_null=False)
    district_id = serializers.UUIDField(required=True, allow_null=False)
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    password_confirm = serializers.CharField(
        write_only=True, min_length=6, required=False, allow_blank=True
    )

    def validate_phone(self, value):
        phone = normalize_phone(value)
        rule = get_phone_rule()
        if not is_phone_valid(phone):
            raise serializers.ValidationError(
                _("Phone must match %(example)s format.") % {"example": rule.example}
            )

        qs = User.objects.filter(phone=phone)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(_("A user with this phone already exists."))
        return phone

    def validate_email(self, value):
        if value in ("", None):
            return None
        normalized = value.lower()
        qs = User.objects.filter(email__iexact=normalized)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(_("A user with this email already exists."))
        return normalized

    def validate_passport_series(self, value):
        return validate_passport_series(value)

    def validate_role(self, value):
        request = self.context["request"]
        ensure_tenant_roles(request.user.tenant)
        role = TenantRole.objects.filter(tenant=request.user.tenant, code=value).first()
        if role is None:
            raise serializers.ValidationError(_("Role not found in your tenant."))
        return value

    def validate(self, attrs):
        region_id = attrs.get("region_id")
        district_id = attrs.get("district_id")
        region = Region.objects.filter(id=region_id).first() if region_id else None
        district = District.objects.filter(id=district_id).select_related("region").first() if district_id else None
        if district and region and district.region_id != region.id:
            raise serializers.ValidationError({"district_id": _("District does not belong to selected region.")})
        if district and not region:
            region = district.region
        if "region_id" in attrs:
            attrs["region"] = region
        if "district_id" in attrs:
            attrs["district"] = district
        password = attrs.get("password") or ""
        password_confirm = attrs.get("password_confirm") or ""

        if password or password_confirm:
            if password != password_confirm:
                raise serializers.ValidationError({"password_confirm": _("Passwords do not match.")})
            password_validation.validate_password(password, user=self.instance)

        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        validated_data.pop("password_confirm", None)
        validated_data.pop("region_id", None)
        validated_data.pop("district_id", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)
            instance.save()
            return instance

        instance.save(
            update_fields=[
                "first_name",
                "last_name",
                "middle_name",
                "birth_date",
                "phone",
                "email",
                "passport_series",
                "gender",
                "role",
                "region",
                "district",
            ]
        )
        return instance


class TenantRolePermissionsUpdateSerializer(serializers.Serializer):
    permissions = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=True,
    )

    def validate_permissions(self, value):
        role = self.context.get("role")
        normalized = []
        seen = set()
        for item in value:
            permission = str(item or "").strip()
            if permission == "":
                continue
            if permission not in ALL_PERMISSIONS:
                raise serializers.ValidationError(
                    _("Unsupported permission: %(permission)s") % {"permission": permission}
                )
            if permission in seen:
                continue
            normalized.append(permission)
            seen.add(permission)

        if role == "admin":
            for permission in ADMIN_REQUIRED_PERMISSIONS:
                if permission not in seen:
                    normalized.append(permission)
                    seen.add(permission)

        return normalized

    def save(self, **kwargs):
        request = self.context["request"]
        role = self.context["role"]
        permissions = self.validated_data["permissions"]

        RolePermission.objects.filter(tenant=request.user.tenant, role=role).delete()
        RolePermission.objects.bulk_create(
            [
                RolePermission(tenant=request.user.tenant, role=role, permission=permission)
                for permission in permissions
            ]
        )
        return permissions


class TenantRoleCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)

    def validate_name(self, value):
        normalized = str(value or "").strip()
        if normalized == "":
            raise serializers.ValidationError(_("Role name is required."))
        return normalized

    def validate(self, attrs):
        request = self.context["request"]
        base_code = slugify(attrs["name"]).replace("_", "-")
        if base_code == "":
            base_code = "role"

        candidate = base_code[:64]
        suffix = 2
        while TenantRole.objects.filter(tenant=request.user.tenant, code=candidate).exists():
            suffix_str = f"-{suffix}"
            candidate = f"{base_code[: max(1, 64 - len(suffix_str))]}{suffix_str}"
            suffix += 1

        attrs["code"] = candidate
        return attrs


class TenantRoleUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)

    def validate_name(self, value):
        normalized = str(value or "").strip()
        if normalized == "":
            raise serializers.ValidationError(_("Role name is required."))
        return normalized
