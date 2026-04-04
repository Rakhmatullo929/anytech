import uuid

from django.db import models


class Sale(models.Model):
    class PaymentType(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        DEBT = "debt", "Debt"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="sales"
    )
    client = models.ForeignKey(
        "clients.Client", on_delete=models.SET_NULL, null=True, blank=True, related_name="sales"
    )
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PaymentType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sales"

    def __str__(self):
        return f"Sale {self.id}"


class SaleItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="sale_items"
    )
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "sale_items"

    def __str__(self):
        return f"{self.product} x {self.quantity}"
