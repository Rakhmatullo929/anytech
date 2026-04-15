from rest_framework.viewsets import ModelViewSet

from auth_tenant.mixins import TenantQuerySetMixin
from auth_tenant.permissions import page_action_permission

from .models import Sale
from .serializers import SaleCreateSerializer, SaleDetailSerializer, SaleListSerializer


class SaleViewSet(TenantQuerySetMixin, ModelViewSet):
    queryset = Sale.objects.select_related("client").all()
    serializer_class = SaleListSerializer
    http_method_names = ["get", "post", "head", "options"]

    filterset_fields = ["payment_type"]
    ordering_fields = ["created_at", "total_amount"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "retrieve":
            return [page_action_permission("sales", "detail")()]
        if self.action == "list":
            return [page_action_permission("sales", "read")()]
        return [page_action_permission("sales", "write")()]

    def get_serializer_class(self):
        if self.action == "create":
            return SaleCreateSerializer
        if self.action == "retrieve":
            return SaleDetailSerializer
        return SaleListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        payment_type = self.request.query_params.get("payment_type")
        if payment_type in {
            Sale.PaymentType.CASH,
            Sale.PaymentType.CARD,
            Sale.PaymentType.DEBT,
        }:
            qs = qs.filter(payment_type=payment_type)
        if self.action == "retrieve":
            qs = qs.prefetch_related("items__product")
        return qs
