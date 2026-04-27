from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from auth_tenant.mixins import TenantQuerySetMixin
from auth_tenant.permissions import page_action_permission

from .models import Category, Product
from .serializers import (
    CategoryBulkDeleteSerializer,
    CategorySerializer,
    ProductBulkDeleteSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductSerializer,
    ProductUpdateSerializer,
)


class ProductViewSet(TenantQuerySetMixin, ModelViewSet):
    queryset = Product.objects.all().prefetch_related("images")
    serializer_class = ProductSerializer
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    search_fields = ["name", "sku"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ("list", "search"):
            return [page_action_permission("products", "read")()]
        if self.action == "retrieve":
            return [page_action_permission("products", "detail")()]
        return [page_action_permission("products", "write")()]

    def get_serializer_class(self):
        if self.action in ("list", "search"):
            return ProductListSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        if self.action in ("update", "partial_update"):
            return ProductUpdateSerializer
        return ProductSerializer

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        return self.list(request)

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        serializer = ProductBulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data["ids"]
        deleted_count, _details = self.get_queryset().filter(id__in=ids).delete()
        return Response({"deleted": deleted_count})


class CategoryViewSet(TenantQuerySetMixin, ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    http_method_names = ["get", "post", "put", "delete", "head", "options"]

    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "list":
            return [page_action_permission("categories", "read")()]
        if self.action == "retrieve":
            return [page_action_permission("categories", "detail")()]
        return [page_action_permission("categories", "write")()]

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        serializer = CategoryBulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data["ids"]
        deleted_count, _details = self.get_queryset().filter(id__in=ids).delete()
        return Response({"deleted": deleted_count})
