from django.urls import path

from .views import DebtViewSet

urlpatterns = [
    path("", DebtViewSet.as_view({"get": "list"}), name="debt-list"),
    path("<uuid:pk>/", DebtViewSet.as_view({"get": "retrieve"}), name="debt-detail"),
    path("<uuid:pk>/pay/", DebtViewSet.as_view({"post": "pay"}), name="debt-pay"),
]
