from django.urls import path

from .views import ClientViewSet, GroupViewSet

urlpatterns = [
    path(
        "groups/",
        GroupViewSet.as_view({"get": "list"}),
        name="group-list",
    ),
    path(
        "groups/<uuid:pk>/",
        GroupViewSet.as_view({"get": "retrieve"}),
        name="group-detail",
    ),
    path(
        "",
        ClientViewSet.as_view({"get": "list", "post": "create"}),
        name="client-list",
    ),
    path(
        "search/",
        ClientViewSet.as_view({"get": "search"}),
        name="client-search",
    ),
    path(
        "bulk-delete/",
        ClientViewSet.as_view({"post": "bulk_delete"}),
        name="client-bulk-delete",
    ),
    path(
        "bulk-create-excel/",
        ClientViewSet.as_view({"post": "bulk_create_excel"}),
        name="client-bulk-create-excel",
    ),
    path(
        "<uuid:pk>/",
        ClientViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="client-detail",
    ),
]
