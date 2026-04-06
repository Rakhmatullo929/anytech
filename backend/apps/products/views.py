from django.db import transaction
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from auth_tenant.mixins import TenantQuerySetMixin
from auth_tenant.permissions import IsManagerOrAbove, IsSellerOrAbove

from .models import Product
from .serializers import (
    ProductSerializer,
    ProductUpdateSerializer,
    StockAdjustmentSerializer,
)


class ProductViewSet(TenantQuerySetMixin, ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    search_fields = ["name", "sku"]
    ordering_fields = ["name", "created_at", "sale_price", "stock"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "search"):
            return [IsSellerOrAbove()]
        return [IsManagerOrAbove()]

    def get_serializer_class(self):
        if self.action == "update":
            return ProductUpdateSerializer
        if self.action == "adjust_stock":
            return StockAdjustmentSerializer
        return ProductSerializer

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        return self.list(request)

    @action(detail=True, methods=["patch"], url_path="stock")
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data["quantity"]

        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product.pk)
            new_stock = product.stock + quantity
            if new_stock < 0:
                raise ValidationError(
                    {
                        "detail": (
                            f"Insufficient stock. "
                            f"Current: {product.stock}, adjustment: {quantity}."
                        )
                    }
                )
            product.stock = new_stock
            product.save(update_fields=["stock", "updated_at"])

        return Response(
            ProductSerializer(product, context=self.get_serializer_context()).data
        )
