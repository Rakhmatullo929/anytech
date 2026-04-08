from django.db import transaction
from django.http import Http404
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from auth_tenant.mixins import TenantQuerySetMixin
from auth_tenant.permissions import IsSellerOrAbove

from .models import Debt, Payment
from .serializers import DebtDetailSerializer, DebtListSerializer, PaymentCreateSerializer


class DebtViewSet(TenantQuerySetMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """
    Debts are created automatically via debt-type sales.
    This ViewSet only allows listing, retrieving, and recording payments.
    """
    queryset = Debt.objects.select_related("client").all()
    serializer_class = DebtListSerializer

    filterset_fields = ["status"]
    ordering_fields = ["created_at", "total_amount"]
    ordering = ["-created_at"]

    def get_permissions(self):
        return [IsSellerOrAbove()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DebtDetailSerializer
        if self.action == "pay":
            return PaymentCreateSerializer
        return DebtListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get("status")
        if status in {Debt.Status.ACTIVE, Debt.Status.CLOSED}:
            qs = qs.filter(status=status)
        if self.action == "retrieve":
            qs = qs.prefetch_related("payments")
        return qs

    @action(detail=True, methods=["post"], url_path="pay")
    def pay(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]

        with transaction.atomic():
            try:
                debt = (
                    self.get_queryset()
                    .select_for_update()
                    .select_related("client")
                    .get(pk=pk)
                )
            except Debt.DoesNotExist:
                raise Http404

            if debt.status == Debt.Status.CLOSED:
                raise ValidationError({"detail": "Debt is already closed."})

            if amount > debt.remaining:
                raise ValidationError(
                    {"detail": f"Amount exceeds remaining debt of {debt.remaining}."}
                )

            Payment.objects.create(debt=debt, amount=amount)

            debt.paid_amount += amount
            if debt.paid_amount >= debt.total_amount:
                debt.status = Debt.Status.CLOSED
            debt.save(update_fields=["paid_amount", "status", "updated_at"])

        debt = (
            self.get_queryset()
            .select_related("client")
            .prefetch_related("payments")
            .get(pk=pk)
        )
        return Response(
            DebtDetailSerializer(debt, context=self.get_serializer_context()).data
        )
