import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class CashRegister(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", _("Open")
        CLOSED = "closed", _("Closed")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        "auth_tenant.Tenant",
        on_delete=models.CASCADE,
        related_name="cash_register",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.CLOSED,
    )
    opened_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    opened_by = models.ForeignKey(
        "auth_tenant.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opened_cash_registers",
    )
    closed_by = models.ForeignKey(
        "auth_tenant.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="closed_cash_registers",
    )

    class Meta:
        db_table = "cash_registers"

    def __str__(self):
        return f"CashRegister({self.tenant_id}, {self.status})"
