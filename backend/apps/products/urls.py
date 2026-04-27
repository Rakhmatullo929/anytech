from django.urls import path

from .views import ProductViewSet

urlpatterns = [
    path(
        "",
        ProductViewSet.as_view({"get": "list", "post": "create"}),
        name="product-list",
    ),
    path(
        "search/",
        ProductViewSet.as_view({"get": "search"}),
        name="product-search",
    ),
    path(
        "bulk-delete/",
        ProductViewSet.as_view({"post": "bulk_delete"}),
        name="product-bulk-delete",
    ),
    path(
        "<uuid:pk>/",
        ProductViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-detail",
    ),
]
