import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class Client(models.Model):
    class CommunicationLanguage(models.TextChoices):
        UZ = "uz", _("Uzbek")
        RU = "ru", _("Russian")
        EN = "en", _("English")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "auth_tenant.Tenant", on_delete=models.CASCADE, related_name="clients"
    )
    name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, default="")
    middle_name = models.CharField(max_length=255, blank=True, default="")
    birth_date = models.DateField(null=True, blank=True)
    communication_language = models.CharField(
        max_length=8,
        choices=CommunicationLanguage.choices,
        blank=True,
        default="",
    )
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
