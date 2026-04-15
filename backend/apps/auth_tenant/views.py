from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .permissions import IsAdmin
from .serializers import (
    ImpersonateSerializer,
    RegisterSerializer,
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
        return Response({"user": serializer.data})


class TenantUsersListView(generics.ListCreateAPIView):
    """Tenant users list (admin only)."""

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsAdmin)
    search_fields = ("name", "phone", "email", "role")
    ordering_fields = ("name", "role", "created_at")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TenantUserCreateSerializer
        return UserSerializer

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
    permission_classes = (IsAuthenticated, IsAdmin)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return TenantUserUpdateSerializer
        return UserSerializer

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
    permission_classes = (IsAuthenticated, IsAdmin)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.validated_data["target_user"]

        refresh = CustomTokenObtainPairSerializer.get_token(target_user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(target_user).data,
            },
            status=status.HTTP_200_OK,
        )
