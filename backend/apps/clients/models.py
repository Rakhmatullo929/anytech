import uuid

from django.db import models


class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="client_groups"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    clients = models.ManyToManyField(
        "Client",
        related_name="groups",
        blank=True,
        db_table="clients_groups",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "client_groups"
        indexes = [
            models.Index(fields=["tenant", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "name"],
                name="unique_group_name_per_tenant",
            ),
        ]

    def __str__(self):
        return self.name


class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="clients"
    )
    name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, default="")
    middle_name = models.CharField(max_length=255, blank=True, default="")
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=32, blank=True, default="")
    marital_status = models.CharField(max_length=32, blank=True, default="")
    phone = models.CharField(max_length=20)
    phones = models.JSONField(default=list, blank=True)
    addresses = models.JSONField(default=list, blank=True)
    social_networks = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "clients"
        indexes = [
            models.Index(fields=["tenant", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "phone"],
                name="unique_phone_per_tenant",
            ),
        ]

    def __str__(self):
        return self.name
