class TenantQuerySetMixin:
    """
    Automatically scopes querysets to the authenticated user's tenant.
    Auto-sets tenant on create. Tenant is immutable on update.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_authenticated and user.tenant_id:
            return queryset.filter(tenant_id=user.tenant_id)
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    def perform_update(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
