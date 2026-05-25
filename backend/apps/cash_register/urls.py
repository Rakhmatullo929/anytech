from django.urls import path

from .views import CashRegisterViewSet

urlpatterns = [
    path(
        "",
        CashRegisterViewSet.as_view({"get": "status"}),
        name="cash-register-status",
    ),
    path(
        "open/",
        CashRegisterViewSet.as_view({"post": "open_register"}),
        name="cash-register-open",
    ),
    path(
        "close/",
        CashRegisterViewSet.as_view({"post": "close_register"}),
        name="cash-register-close",
    ),
]
