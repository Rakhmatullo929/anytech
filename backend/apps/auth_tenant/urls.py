from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .tokens import CustomTokenObtainPairSerializer
from .views import (
    MeView,
    RegisterView,
    TenantImpersonateView,
    TenantUserDetailView,
    TenantUsersListView,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("users/", TenantUsersListView.as_view(), name="auth-users"),
    path("users/<uuid:pk>/", TenantUserDetailView.as_view(), name="auth-user-detail"),
    path("impersonate/", TenantImpersonateView.as_view(), name="auth-impersonate"),
]
