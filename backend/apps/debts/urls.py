from django.urls import path

from .views import DebtPaymentViewSet, DebtViewSet

urlpatterns = [
    path("", DebtViewSet.as_view({"get": "list"}), name="debt-list"),
    path("export-excel/", DebtViewSet.as_view({"get": "export_excel"}), name="debt-export-excel"),
    path("<uuid:pk>/", DebtViewSet.as_view({"get": "retrieve"}), name="debt-detail"),
    path("<uuid:pk>/pay/", DebtViewSet.as_view({"post": "pay"}), name="debt-pay"),
    path("payments/", DebtPaymentViewSet.as_view({"get": "list"}), name="debt-payment-list"),
    path("payments/export-excel/", DebtPaymentViewSet.as_view({"get": "export_excel"}), name="debt-payment-export-excel"),
]
