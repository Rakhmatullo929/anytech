from io import BytesIO

from django.db import transaction
from django.db.models import DecimalField, ExpressionWrapper, F
from django.http import Http404, HttpResponse
from django.utils.translation import gettext as _
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from auth_tenant.mixins import TenantQuerySetMixin
from auth_tenant.permissions import page_action_permission

from .models import Debt, Payment
from .serializers import DebtDetailSerializer, DebtListSerializer, PaymentCreateSerializer


class DebtViewSet(TenantQuerySetMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = Debt.objects.select_related("client").all()
    serializer_class = DebtListSerializer

    filterset_fields = ["status"]
    ordering_fields = ["created_at", "total_amount", "paid_amount", "remaining_amount", "status", "deadline", "client__name"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "retrieve":
            return [page_action_permission("debts", "detail")()]
        if self.action in ("list", "export_excel"):
            return [page_action_permission("debts", "read")()]
        return [page_action_permission("debts", "write")()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DebtDetailSerializer
        if self.action == "pay":
            return PaymentCreateSerializer
        return DebtListSerializer

    def get_queryset(self):
        qs = super().get_queryset().annotate(
            remaining_amount=ExpressionWrapper(
                F("total_amount") - F("paid_amount"),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        )

        status = self.request.query_params.get("status")
        if status in {Debt.Status.ACTIVE, Debt.Status.CLOSED}:
            qs = qs.filter(status=status)

        client_ids_raw = self.request.query_params.get("client_ids")
        if client_ids_raw:
            ids = [i.strip() for i in client_ids_raw.split(",") if i.strip()]
            if ids:
                qs = qs.filter(client__id__in=ids)

        date_from = self.request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        deadline_from = self.request.query_params.get("deadline_from")
        if deadline_from:
            qs = qs.filter(deadline__gte=deadline_from)

        deadline_to = self.request.query_params.get("deadline_to")
        if deadline_to:
            qs = qs.filter(deadline__lte=deadline_to)

        amount_from = self.request.query_params.get("amount_from")
        if amount_from:
            try:
                qs = qs.filter(total_amount__gte=amount_from)
            except (ValueError, TypeError):
                pass

        amount_to = self.request.query_params.get("amount_to")
        if amount_to:
            try:
                qs = qs.filter(total_amount__lte=amount_to)
            except (ValueError, TypeError):
                pass

        if self.action == "retrieve":
            qs = qs.prefetch_related("payments")
        return qs

    @action(detail=False, methods=["get"], url_path="export-excel")
    def export_excel(self, request):
        try:
            from openpyxl import Workbook
            from openpyxl.styles import Alignment, Font, PatternFill
        except ImportError as exc:
            raise ValidationError(
                {"detail": _("Excel export requires openpyxl package on backend.")}
            ) from exc

        queryset = self.filter_queryset(self.get_queryset())

        wb = Workbook()
        ws = wb.active
        ws.title = "Debts"

        headers = ["ID", "Client", "Total", "Paid", "Remaining", "Status", "Deadline", "Created"]
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")

        for col_idx, header in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for debt in queryset.iterator(chunk_size=500):
            ws.append([
                str(debt.id),
                debt.client.name if debt.client else "",
                float(debt.total_amount),
                float(debt.paid_amount),
                float(debt.remaining),
                debt.get_status_display(),
                debt.deadline.strftime("%Y-%m-%d") if debt.deadline else "",
                debt.created_at.strftime("%Y-%m-%d %H:%M"),
            ])

        for col in ws.columns:
            ws.column_dimensions[col[0].column_letter].width = 20

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="debts_export.xlsx"'
        return response

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
                raise ValidationError({"detail": _("Debt is already closed.")})

            if amount > debt.remaining:
                raise ValidationError(
                    {"detail": _("Amount exceeds remaining debt of %(remaining)s.") % {
                        "remaining": debt.remaining
                    }}
                )

            payment_method = serializer.validated_data.get(
                "payment_method", Payment.PaymentMethod.CASH
            )
            Payment.objects.create(debt=debt, amount=amount, payment_method=payment_method)

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
