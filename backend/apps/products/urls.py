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
        "<uuid:pk>/",
        ProductViewSet.as_view({"get": "retrieve", "put": "update"}),
        name="product-detail",
    ),
    path(
        "<uuid:pk>/stock/",
        ProductViewSet.as_view({"patch": "adjust_stock"}),
        name="product-stock",
    ),
]
