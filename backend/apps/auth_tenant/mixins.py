from rest_framework.exceptions import PermissionDenied


class TenantQuerySetMixin:
    """
    Automatically scopes querysets to the authenticated user's tenant.
    Auto-sets tenant on create. Tenant is immutable on update.

    Cross-tenant write protection: if the serializer exposes `tenant` as
    writable and the payload supplies a *different* tenant than the caller's,
    raise 403 instead of silently overwriting. All current serializers mark
    `tenant` read-only so this is defense-in-depth — but the silent rewrite
    would mask a real bug if `tenant` ever becomes writable on a new model.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.tenant_id:
            return queryset.filter(tenant_id=user.tenant_id)
        return queryset.none()

    def _assert_tenant_or_403(self, serializer):
        payload_tenant = serializer.validated_data.get("tenant")
        if payload_tenant is not None and payload_tenant != self.request.user.tenant:
            raise PermissionDenied("Cross-tenant write is not allowed.")

    def perform_create(self, serializer):
        self._assert_tenant_or_403(serializer)
        serializer.save(tenant=self.request.user.tenant)

    def perform_update(self, serializer):
        self._assert_tenant_or_403(serializer)
        serializer.save(tenant=self.request.user.tenant)
