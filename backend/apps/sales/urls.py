from django.urls import path

from .views import SaleViewSet

urlpatterns = [
    path("", SaleViewSet.as_view({"get": "list", "post": "create"}), name="sale-list"),
    path("export-excel/", SaleViewSet.as_view({"get": "export_excel"}), name="sale-export-excel"),
    path("<uuid:pk>/", SaleViewSet.as_view({"get": "retrieve"}), name="sale-detail"),
]
