from django.urls import path

from .views import CategoryViewSet

urlpatterns = [
    path(
        "",
        CategoryViewSet.as_view({"get": "list", "post": "create"}),
        name="category-list",
    ),
    path(
        "bulk-delete/",
        CategoryViewSet.as_view({"post": "bulk_delete"}),
        name="category-bulk-delete",
    ),
    path(
        "<uuid:pk>/",
        CategoryViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="category-detail",
    ),
]
