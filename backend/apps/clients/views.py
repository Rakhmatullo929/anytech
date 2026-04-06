from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet

from auth_tenant.mixins import TenantQuerySetMixin
from auth_tenant.permissions import IsManagerOrAbove, IsSellerOrAbove

from .models import Client
from .serializers import ClientDetailSerializer, ClientSerializer


class ClientViewSet(TenantQuerySetMixin, ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    search_fields = ["name", "phone"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "search"):
            return [IsSellerOrAbove()]
        return [IsManagerOrAbove()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ClientDetailSerializer
        return ClientSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "sales__items__product",
                "sales__debt",
                "debts",
            )
        return qs

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        return self.list(request)
