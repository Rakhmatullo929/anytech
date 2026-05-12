from datetime import date, timedelta
from decimal import Decimal

from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Avg, Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import Coalesce, TruncDate, TruncMonth

from auth_tenant.permissions import page_action_permission
from clients.models import Client
from config.pagination import StandardResultsSetPagination
from debts.models import Debt
from sales.models import Sale, SaleItem


def _parse_date(value, default: date) -> date:
    try:
        return date.fromisoformat(value) if value else default
    except (ValueError, TypeError):
        return default


def _date_range(request):
    today = date.today()
    date_from = _parse_date(request.query_params.get("date_from"), today - timedelta(days=30))
    date_to = _parse_date(request.query_params.get("date_to"), today)
    return date_from, date_to


def _safe_ordering(value: str, allowed: set, default: str) -> str:
    return value if value in allowed else default


# ── Analytics (charts + stat cards) ───────────────────────────────────────────

class CustomerReportView(APIView):
    permission_classes = [page_action_permission("reports", "read")]

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)

        total = Client.objects.filter(tenant=tenant).count()
        new_in_period = Client.objects.filter(
            tenant=tenant,
            created_at__date__range=(date_from, date_to),
        ).count()

        registration_trend = list(
            Client.objects.filter(tenant=tenant)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        return Response({
            "total_customers": total,
            "new_in_period": new_in_period,
            "registration_trend": [
                {"month": t["month"].strftime("%Y-%m") if t["month"] else "", "count": t["count"]}
                for t in registration_trend
            ],
        })


class SalesReportView(APIView):
    permission_classes = [page_action_permission("reports", "read")]

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)

        sale_qs = Sale.objects.filter(tenant=tenant, created_at__date__range=(date_from, date_to))

        summary = sale_qs.aggregate(
            total_sales=Count("id"),
            total_revenue=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
            avg_order=Coalesce(Avg("total_amount"), Decimal("0"), output_field=DecimalField()),
        )

        cost_agg = SaleItem.objects.filter(
            sale__tenant=tenant,
            sale__created_at__date__range=(date_from, date_to),
            cost__isnull=False,
        ).aggregate(
            total_cost=Coalesce(
                Sum(ExpressionWrapper(F("cost") * F("quantity"), output_field=DecimalField())),
                Decimal("0"),
                output_field=DecimalField(),
            ),
            item_revenue=Coalesce(
                Sum(ExpressionWrapper(F("price") * F("quantity"), output_field=DecimalField())),
                Decimal("0"),
                output_field=DecimalField(),
            ),
        )

        by_payment = list(
            sale_qs.values("payment_type")
            .annotate(
                count=Count("id"),
                total=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
            )
            .order_by("payment_type")
        )

        revenue_trend = list(
            sale_qs.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(
                revenue=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
                count=Count("id"),
            )
            .order_by("day")
        )

        return Response({
            "total_sales": summary["total_sales"],
            "total_revenue": str(summary["total_revenue"]),
            "total_profit": str(cost_agg["item_revenue"] - cost_agg["total_cost"]),
            "avg_order_value": str(summary["avg_order"]),
            "by_payment_type": [
                {"payment_type": p["payment_type"], "count": p["count"], "total": str(p["total"])}
                for p in by_payment
            ],
            "revenue_trend": [
                {"date": t["day"].strftime("%Y-%m-%d") if t["day"] else "", "revenue": str(t["revenue"]), "count": t["count"]}
                for t in revenue_trend
            ],
        })


class EmployeeReportView(APIView):
    permission_classes = [page_action_permission("reports", "read")]

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)

        sale_qs = Sale.objects.filter(
            tenant=tenant,
            created_at__date__range=(date_from, date_to),
            created_by__isnull=False,
        )

        summary = sale_qs.aggregate(
            total_employees=Count("created_by", distinct=True),
            total_sales_count=Count("id"),
            total_revenue=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
        )

        top_employees = list(
            sale_qs.values(
                "created_by__id", "created_by__first_name",
                "created_by__last_name", "created_by__phone",
            )
            .annotate(
                sales_count=Count("id"),
                total_revenue=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
                avg_amount=Coalesce(Avg("total_amount"), Decimal("0"), output_field=DecimalField()),
            )
            .order_by("-total_revenue")[:10]
        )

        revenue_trend = list(
            Sale.objects.filter(tenant=tenant, created_at__date__range=(date_from, date_to))
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(
                revenue=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
                count=Count("id"),
            )
            .order_by("day")
        )

        return Response({
            "total_employees": summary["total_employees"],
            "total_sales_count": summary["total_sales_count"],
            "total_revenue": str(summary["total_revenue"]),
            "top_employees": [
                {
                    "id": str(e["created_by__id"]),
                    "name": (
                        " ".join(filter(None, [e["created_by__first_name"], e["created_by__last_name"]]))
                        or e["created_by__phone"]
                    ),
                    "sales_count": e["sales_count"],
                    "total_revenue": str(e["total_revenue"]),
                    "avg_amount": str(e["avg_amount"]),
                }
                for e in top_employees
            ],
            "revenue_trend": [
                {"date": t["day"].strftime("%Y-%m-%d") if t["day"] else "", "revenue": str(t["revenue"]), "count": t["count"]}
                for t in revenue_trend
            ],
        })


class DebtReportView(APIView):
    permission_classes = [page_action_permission("reports", "read")]

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)

        debt_qs = Debt.objects.filter(tenant=tenant)
        summary = debt_qs.aggregate(
            total_debts=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
            paid_debts=Coalesce(Sum("paid_amount"), Decimal("0"), output_field=DecimalField()),
        )

        overdue_agg = debt_qs.filter(
            status=Debt.Status.ACTIVE,
            deadline__lt=date.today(),
        ).aggregate(
            overdue=Coalesce(
                Sum(ExpressionWrapper(
                    F("total_amount") - F("paid_amount"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )),
                Decimal("0"),
                output_field=DecimalField(),
            )
        )

        status_breakdown = list(
            debt_qs.values("status")
            .annotate(
                count=Count("id"),
                total=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
            )
        )

        from debts.models import Payment
        payment_trend = list(
            Payment.objects.filter(
                debt__tenant=tenant,
                created_at__date__range=(date_from, date_to),
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(amount=Coalesce(Sum("amount"), Decimal("0"), output_field=DecimalField()))
            .order_by("day")
        )

        remaining = summary["total_debts"] - summary["paid_debts"]

        return Response({
            "total_debts": str(summary["total_debts"]),
            "paid_debts": str(summary["paid_debts"]),
            "remaining_debts": str(remaining),
            "overdue_debts": str(overdue_agg["overdue"]),
            "status_breakdown": [
                {"status": s["status"], "count": s["count"], "total": str(s["total"])}
                for s in status_breakdown
            ],
            "payment_trend": [
                {"date": t["day"].strftime("%Y-%m-%d") if t["day"] else "", "amount": str(t["amount"])}
                for t in payment_trend
            ],
        })


# ── Paginated tables ───────────────────────────────────────────────────────────

class TopCustomersListView(APIView):
    permission_classes = [page_action_permission("reports", "read")]
    _ORDERINGS = {"-total_spent", "total_spent", "-sales_count", "sales_count"}

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)
        ordering = _safe_ordering(request.query_params.get("ordering", ""), self._ORDERINGS, "-total_spent")

        qs = (
            Sale.objects.filter(
                tenant=tenant,
                created_at__date__range=(date_from, date_to),
                client__isnull=False,
            )
            .values("client__id", "client__name", "client__last_name", "client__phone")
            .annotate(
                total_spent=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
                sales_count=Count("id"),
            )
            .order_by(ordering)
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response([
            {
                "id": str(c["client__id"]),
                "name": " ".join(filter(None, [c["client__name"], c["client__last_name"]])),
                "phone": c["client__phone"] or "",
                "total_spent": str(c["total_spent"]),
                "sales_count": c["sales_count"],
            }
            for c in page
        ])


class TopDebtorsListView(APIView):
    permission_classes = [page_action_permission("reports", "read")]
    _ORDERINGS = {"-remaining", "remaining"}

    def get(self, request):
        tenant = request.user.tenant
        ordering = _safe_ordering(request.query_params.get("ordering", ""), self._ORDERINGS, "-remaining")

        qs = (
            Debt.objects.filter(tenant=tenant, status=Debt.Status.ACTIVE)
            .values("client__id", "client__name", "client__last_name", "client__phone")
            .annotate(
                total_debt=Sum("total_amount"),
                total_paid=Sum("paid_amount"),
            )
            .annotate(
                remaining=ExpressionWrapper(
                    F("total_debt") - F("total_paid"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            )
            .order_by(ordering)
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response([
            {
                "id": str(d["client__id"]),
                "name": " ".join(filter(None, [d["client__name"], d["client__last_name"]])),
                "phone": d["client__phone"] or "",
                "remaining": str(d["remaining"] or Decimal("0")),
            }
            for d in page
        ])


class TopProductsListView(APIView):
    permission_classes = [page_action_permission("reports", "read")]
    _ORDERINGS = {"-total_revenue", "total_revenue", "-total_qty", "total_qty"}

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)
        ordering = _safe_ordering(request.query_params.get("ordering", ""), self._ORDERINGS, "-total_revenue")

        qs = (
            SaleItem.objects.filter(
                sale__tenant=tenant,
                sale__created_at__date__range=(date_from, date_to),
            )
            .values("product__id", "product__name")
            .annotate(
                total_qty=Sum("quantity"),
                total_revenue=Coalesce(
                    Sum(ExpressionWrapper(F("price") * F("quantity"), output_field=DecimalField())),
                    Decimal("0"),
                    output_field=DecimalField(),
                ),
            )
            .order_by(ordering)
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response([
            {
                "id": str(p["product__id"]),
                "name": p["product__name"],
                "total_qty": p["total_qty"],
                "total_revenue": str(p["total_revenue"]),
            }
            for p in page
        ])


class TopCategoriesListView(APIView):
    permission_classes = [page_action_permission("reports", "read")]
    _ORDERINGS = {"-total_revenue", "total_revenue"}

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)
        ordering = _safe_ordering(request.query_params.get("ordering", ""), self._ORDERINGS, "-total_revenue")

        qs = (
            SaleItem.objects.filter(
                sale__tenant=tenant,
                sale__created_at__date__range=(date_from, date_to),
            )
            .values("product__category__id", "product__category__name")
            .annotate(
                total_revenue=Coalesce(
                    Sum(ExpressionWrapper(F("price") * F("quantity"), output_field=DecimalField())),
                    Decimal("0"),
                    output_field=DecimalField(),
                ),
            )
            .order_by(ordering)
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response([
            {
                "id": str(c["product__category__id"]) if c["product__category__id"] else "",
                "name": c["product__category__name"] or "—",
                "total_revenue": str(c["total_revenue"]),
            }
            for c in page
        ])


class EmployeeStatsListView(APIView):
    permission_classes = [page_action_permission("reports", "read")]
    _ORDERINGS = {"-total_revenue", "total_revenue", "-sales_count", "sales_count"}

    def get(self, request):
        tenant = request.user.tenant
        date_from, date_to = _date_range(request)
        ordering = _safe_ordering(request.query_params.get("ordering", ""), self._ORDERINGS, "-total_revenue")

        qs = (
            Sale.objects.filter(
                tenant=tenant,
                created_at__date__range=(date_from, date_to),
                created_by__isnull=False,
            )
            .values(
                "created_by__id", "created_by__first_name",
                "created_by__last_name", "created_by__phone",
            )
            .annotate(
                sales_count=Count("id"),
                total_revenue=Coalesce(Sum("total_amount"), Decimal("0"), output_field=DecimalField()),
                avg_amount=Coalesce(Avg("total_amount"), Decimal("0"), output_field=DecimalField()),
            )
            .order_by(ordering)
        )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response([
            {
                "id": str(e["created_by__id"]),
                "name": (
                    " ".join(filter(None, [e["created_by__first_name"], e["created_by__last_name"]]))
                    or e["created_by__phone"]
                ),
                "sales_count": e["sales_count"],
                "total_revenue": str(e["total_revenue"]),
                "avg_amount": str(e["avg_amount"]),
            }
            for e in page
        ])
