from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .tokens import CustomTokenObtainPairSerializer
from .views import (
    MeView,
    RegisterView,
    RegionDistrictListView,
    RegionListView,
    TenantImpersonateView,
    TenantRoleCreateView,
    TenantRoleDeleteView,
    TenantRolePermissionsUpdateView,
    TenantUserDetailView,
    TenantUsersListView,
    TenantRolesListView,
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
    path("roles/", TenantRolesListView.as_view(), name="auth-roles"),
    path("roles/create/", TenantRoleCreateView.as_view(), name="auth-role-create"),
    path("roles/<str:role>/", TenantRoleDeleteView.as_view(), name="auth-role-delete"),
    path("roles/<str:role>/permissions/", TenantRolePermissionsUpdateView.as_view(), name="auth-role-permissions"),
    path("impersonate/", TenantImpersonateView.as_view(), name="auth-impersonate"),
    path("locations/regions/", RegionListView.as_view(), name="locations-regions"),
    path("locations/regions/<uuid:pk>/districts/", RegionDistrictListView.as_view(), name="locations-region-districts"),
]
