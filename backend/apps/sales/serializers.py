from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from debts.models import Debt
from products.models import Product

from .models import Sale, SaleItem


# ── Write serializers (input) ─────────────────────────────────────────


class SaleItemWriteSerializer(serializers.Serializer):
    product = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Sale
        fields = ("id", "tenant", "client", "payment_type", "total_amount", "items", "created_at")
        read_only_fields = ("id", "tenant", "total_amount", "created_at")

    def validate(self, attrs):
        if not attrs.get("items"):
            raise serializers.ValidationError({"items": "At least one item is required."})

        if attrs.get("payment_type") == Sale.PaymentType.DEBT and not attrs.get("client"):
            raise serializers.ValidationError(
                {"client": "Client is required for debt sales."}
            )

        # Validate client belongs to the same tenant as the authenticated user
        client = attrs.get("client")
        if client:
            tenant = self.context["request"].user.tenant
            if client.tenant_id != tenant.pk:
                raise serializers.ValidationError(
                    {"client": "Client not found."}
                )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        tenant = validated_data["tenant"]

        product_ids = [item["product"] for item in items_data]

        with transaction.atomic():
            products = Product.objects.select_for_update().filter(
                pk__in=product_ids, tenant=tenant
            )
            products_map = {p.pk: p for p in products}

            # Validate all products exist and belong to tenant
            missing = set(product_ids) - set(products_map.keys())
            if missing:
                raise serializers.ValidationError(
                    {"items": f"Products not found: {', '.join(str(pk) for pk in missing)}"}
                )

            total_amount = Decimal("0.00")
            sale_items = []
            updated_products = []

            for item_data in items_data:
                product = products_map[item_data["product"]]

                if product.stock < item_data["quantity"]:
                    raise serializers.ValidationError(
                        {
                            "items": (
                                f"Insufficient stock for '{product.name}'. "
                                f"Available: {product.stock}, requested: {item_data['quantity']}."
                            )
                        }
                    )

                product.stock -= item_data["quantity"]
                product.updated_at = timezone.now()
                updated_products.append(product)

                line_total = product.sale_price * item_data["quantity"]
                total_amount += line_total

                sale_items.append(
                    SaleItem(
                        product=product,
                        quantity=item_data["quantity"],
                        price=product.sale_price,
                    )
                )

            Product.objects.bulk_update(updated_products, ["stock", "updated_at"])
            validated_data["total_amount"] = total_amount
            sale = Sale.objects.create(**validated_data)

            for si in sale_items:
                si.sale = sale
            SaleItem.objects.bulk_create(sale_items)

            # Auto-create debt for debt-type sales
            if sale.payment_type == Sale.PaymentType.DEBT:
                Debt.objects.create(
                    tenant=tenant,
                    client=sale.client,
                    sale=sale,
                    total_amount=total_amount,
                )

        return sale


# ── Read serializers (output) ──────────────────────────────────────────


class SaleItemReadSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = ("id", "product", "product_name", "quantity", "price")


class SaleListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(
        source="client.name", read_only=True, default=None
    )

    class Meta:
        model = Sale
        fields = ("id", "client", "client_name", "total_amount", "payment_type", "created_at")


class SaleDetailSerializer(SaleListSerializer):
    items = SaleItemReadSerializer(many=True, read_only=True)

    class Meta(SaleListSerializer.Meta):
        fields = SaleListSerializer.Meta.fields + ("items",)
