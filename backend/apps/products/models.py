import uuid

from django.db import models


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(
        "products.Category",
        on_delete=models.SET_NULL,
        related_name="products",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        indexes = [
            models.Index(fields=["tenant", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "sku"],
                name="unique_sku_per_tenant",
                condition=models.Q(sku__isnull=False),
            ),
        ]

    def __str__(self):
        return self.name


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        indexes = [
            models.Index(fields=["tenant", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "name"],
                name="unique_category_name_per_tenant",
            ),
        ]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_images"
        ordering = ["position", "created_at"]
        indexes = [
            models.Index(fields=["product", "position"]),
        ]

    def __str__(self):
        return f"{self.product_id}:{self.position}"
