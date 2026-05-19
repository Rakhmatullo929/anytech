from django.utils import timezone
from django.utils.translation import gettext as _

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from auth_tenant.permissions import page_action_permission

from .models import CashRegister
from .serializers import CashRegisterSerializer


class CashRegisterViewSet(ViewSet):
    def get_permissions(self):
        if self.action == "status":
            return [page_action_permission("cash_register", "read")()]
        return [page_action_permission("cash_register", "write")()]

    def _get_or_create_register(self, tenant):
        register, _ = CashRegister.objects.get_or_create(
            tenant=tenant,
            defaults={"status": CashRegister.Status.CLOSED},
        )
        return register

    def status(self, request):
        register = self._get_or_create_register(request.user.tenant)
        return Response(CashRegisterSerializer(register).data)

    def open_register(self, request):
        register = self._get_or_create_register(request.user.tenant)
        if register.status == CashRegister.Status.OPEN:
            raise ValidationError({"detail": _("Cash register is already open.")})
        register.status = CashRegister.Status.OPEN
        register.opened_at = timezone.now()
        register.opened_by = request.user
        register.save(update_fields=["status", "opened_at", "opened_by"])
        return Response(CashRegisterSerializer(register).data)

    def close_register(self, request):
        register = self._get_or_create_register(request.user.tenant)
        if register.status == CashRegister.Status.CLOSED:
            raise ValidationError({"detail": _("Cash register is already closed.")})
        register.status = CashRegister.Status.CLOSED
        register.closed_at = timezone.now()
        register.closed_by = request.user
        register.save(update_fields=["status", "closed_at", "closed_by"])
        return Response(CashRegisterSerializer(register).data)
