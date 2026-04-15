from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import User
from .permission_catalog import ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS
from .permissions import get_user_permissions, page_action_permission
from .serializers import (
    ImpersonateSerializer,
    RegisterSerializer,
    TenantRolePermissionsUpdateSerializer,
    TenantUserCreateSerializer,
    TenantUserUpdateSerializer,
    UserSerializer,
)
from .tokens import CustomTokenObtainPairSerializer


class AuthRateThrottle(AnonRateThrottle):
    """Strict rate limit for authentication endpoints (login, register)."""
    scope = "auth"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = CustomTokenObtainPairSerializer.get_token(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.GenericAPIView):
    """Current user (JWT)."""

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return Response(
            {
                "user": {
                    **serializer.data,
                    "permissions": sorted(get_user_permissions(request.user)),
                }
            }
        )


class TenantUsersListView(generics.ListCreateAPIView):
    """Tenant users list (admin only)."""

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    search_fields = ("name", "phone", "email", "role")
    ordering_fields = ("name", "role", "created_at")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TenantUserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        if self.request.method == "GET":
            permission_classes.append(page_action_permission("users", "read"))
        else:
            permission_classes.append(page_action_permission("users", "write"))
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        return user.__class__.objects.filter(tenant_id=user.tenant_id).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class TenantUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Tenant user detail (admin only)."""

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return TenantUserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        if self.request.method == "GET":
            permission_classes.append(page_action_permission("users", "detail"))
        else:
            permission_classes.append(page_action_permission("users", "write"))
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        return user.__class__.objects.filter(tenant_id=user.tenant_id).order_by("-created_at")

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise ValidationError({"detail": "You cannot delete your own account."})
        instance.delete()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class TenantImpersonateView(generics.GenericAPIView):
    """Issue JWT as another user inside current tenant (admin only)."""

    serializer_class = ImpersonateSerializer
    permission_classes = (IsAuthenticated, page_action_permission("users", "write"))

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.validated_data["target_user"]

        refresh = CustomTokenObtainPairSerializer.get_token(target_user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    **UserSerializer(target_user).data,
                    "permissions": sorted(get_user_permissions(target_user)),
                },
            },
            status=status.HTTP_200_OK,
        )


class TenantRolesListView(generics.GenericAPIView):
    """Available tenant roles (admin only)."""

    permission_classes = (IsAuthenticated, page_action_permission("roles", "read"))

    def get(self, request, *args, **kwargs):
        role_to_permissions = {
            role: list(DEFAULT_ROLE_PERMISSIONS.get(role, []))
            for role, _label in User.Role.choices
        }

        rows = request.user.tenant.role_permissions.all().values_list("role", "permission")
        custom_roles = set()
        grouped_custom = {}
        for role, permission in rows:
            custom_roles.add(role)
            grouped_custom.setdefault(role, []).append(permission)
        for role in custom_roles:
            role_to_permissions[role] = sorted(grouped_custom.get(role, []))

        roles = [
            {
                "value": value,
                "label": label,
                "permissions": role_to_permissions.get(value, []),
            }
            for value, label in User.Role.choices
        ]
        return Response({"results": roles, "available_permissions": ALL_PERMISSIONS}, status=status.HTTP_200_OK)


class TenantRolePermissionsUpdateView(generics.GenericAPIView):
    """Update permissions for a role inside current tenant (admin only)."""

    serializer_class = TenantRolePermissionsUpdateSerializer
    permission_classes = (IsAuthenticated, page_action_permission("roles", "write"))

    def patch(self, request, role, *args, **kwargs):
        valid_roles = {value: label for value, label in User.Role.choices}
        if role not in valid_roles:
            return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request, "role": role},
        )
        serializer.is_valid(raise_exception=True)
        permissions = serializer.save()
        return Response(
            {
                "value": role,
                "label": valid_roles[role],
                "permissions": permissions,
            },
            status=status.HTTP_200_OK,
        )
