from django.urls import path

from .views import ProductPurchaseViewSet

urlpatterns = [
    path(
        "",
        ProductPurchaseViewSet.as_view({"get": "list", "post": "create"}),
        name="product-purchase-list",
    ),
    path(
        "bulk-delete/",
        ProductPurchaseViewSet.as_view({"post": "bulk_delete"}),
        name="product-purchase-bulk-delete",
    ),
    path(
        "<uuid:pk>/",
        ProductPurchaseViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-purchase-detail",
    ),
]
