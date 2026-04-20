import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class Debt(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        CLOSED = "closed", _("Closed")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="debts"
    )
    client = models.ForeignKey(
        "clients.Client", on_delete=models.CASCADE, related_name="debts"
    )
    sale = models.OneToOneField(
        "sales.Sale", on_delete=models.CASCADE, related_name="debt"
    )
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "debts"

    def __str__(self):
        return f"Debt {self.id} — {self.client}"

    @property
    def remaining(self):
        return self.total_amount - self.paid_amount


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"

    def __str__(self):
        return f"Payment {self.amount} for {self.debt}"
