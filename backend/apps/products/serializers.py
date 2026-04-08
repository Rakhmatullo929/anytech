from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    def validate_sku(self, value):
        if value is not None:
            value = value.strip()
        return value or None

    def validate_purchase_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Purchase price must be >= 0.")
        return value

    def validate_sale_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Sale price must be >= 0.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock must be >= 0.")
        return value

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
    MODE_CHOICES = (("increment", "Increment"), ("set", "Set"))

    quantity = serializers.IntegerField(
        help_text="Value to add/subtract (increment mode) or absolute value (set mode)."
    )
    mode = serializers.ChoiceField(
        choices=MODE_CHOICES,
        default="increment",
        help_text="'increment' to add/subtract, 'set' to overwrite.",
    )

    def validate(self, attrs):
        if attrs.get("mode", "increment") == "increment" and attrs["quantity"] == 0:
            raise serializers.ValidationError(
                {"quantity": "Quantity must not be zero."}
            )
        if attrs.get("mode") == "set" and attrs["quantity"] < 0:
            raise serializers.ValidationError(
                {"quantity": "Stock value must be >= 0."}
            )
        return attrs


class ProductBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )
