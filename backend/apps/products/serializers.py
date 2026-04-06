from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    def validate_sku(self, value):
        if value is not None:
            value = value.strip()
        return value or None

    class Meta:
        model = Product
        fields = (
            "id",
            "tenant",
            "name",
            "sku",
            "purchase_price",
            "sale_price",
            "stock",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class ProductUpdateSerializer(ProductSerializer):
    """Excludes stock — only modifiable via the /stock/ endpoint."""

    class Meta(ProductSerializer.Meta):
        fields = tuple(f for f in ProductSerializer.Meta.fields if f != "stock")


class StockAdjustmentSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(
        help_text="Positive to add stock, negative to subtract."
    )

    def validate_quantity(self, value):
        if value == 0:
            raise serializers.ValidationError("Quantity must not be zero.")
        return value
