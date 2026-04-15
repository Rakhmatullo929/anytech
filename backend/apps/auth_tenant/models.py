import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tenants"

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Phone is required")
        email = extra_fields.pop("email", None)
        normalized_email = self.normalize_email(email) if email else None
        user = self.model(phone=phone.strip(), email=normalized_email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        MANAGER = "manager", "Manager"
        SELLER = "seller", "Seller"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="users", null=True, blank=True
    )
    name = models.CharField(max_length=255, blank=True, default="")
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    passport_series = models.CharField(max_length=9, null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SELLER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.phone or self.email or str(self.id)


class RolePermission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="role_permissions")
    role = models.CharField(max_length=20, choices=User.Role.choices)
    permission = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "role_permissions"
        unique_together = ("tenant", "role", "permission")

    def __str__(self):
        return f"{self.tenant_id}:{self.role}:{self.permission}"
