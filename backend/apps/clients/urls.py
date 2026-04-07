from django.urls import path

from .views import ClientViewSet

urlpatterns = [
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
        "<uuid:pk>/",
        ClientViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="client-detail",
    ),
]
