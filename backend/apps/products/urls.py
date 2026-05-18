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
        "bulk-create-excel/",
        ProductViewSet.as_view({"post": "bulk_create_excel"}),
        name="product-bulk-create-excel",
    ),
    path(
        "export-excel/",
        ProductViewSet.as_view({"get": "export_excel"}),
        name="product-export-excel",
    ),
    path(
        "download-excel-template/",
        ProductViewSet.as_view({"get": "download_excel_template"}),
        name="product-download-excel-template",
    ),
    path(
        "<uuid:pk>/",
        ProductViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="product-detail",
    ),
]
