from decimal import Decimal

from django.db import transaction
from django.utils.translation import gettext as _
from rest_framework import serializers

from debts.models import Debt
from products.models import Product, ProductPurchase

from .models import Sale, SaleItem


# ── Write serializers (input) ─────────────────────────────────────────


class SaleItemWriteSerializer(serializers.Serializer):
    product = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Sale
        fields = ("id", "tenant", "client", "payment_type", "total_amount", "items", "created_at")
        read_only_fields = ("id", "tenant", "total_amount", "created_at")

    def validate(self, attrs):
        if not attrs.get("items"):
            raise serializers.ValidationError({"items": _("At least one item is required.")})

        client = attrs.get("client")
        if not client:
            raise serializers.ValidationError({"client": _("Client is required.")})

        tenant = self.context["request"].user.tenant
        if client.tenant_id != tenant.pk:
            raise serializers.ValidationError({"client": _("Client not found.")})

        return attrs

    def _process_fifo_item(self, product, quantity):
        """Deduct `quantity` units FIFO (oldest purchase first).

        Deletes fully-consumed batches; partially consumed batches are updated.
        Returns FIFO average cost per unit.
        Raises ValidationError if available stock is insufficient.
        Must be called inside an atomic transaction.
        """
        purchases = list(
            ProductPurchase.objects.select_for_update()
            .filter(product=product)
            .order_by("created_at")
        )

        total_available = sum(p.quantity for p in purchases)
        if total_available < quantity:
            raise serializers.ValidationError(
                _("Insufficient stock for «%(name)s». Available: %(qty)s.")
                % {"name": product.name, "qty": total_available}
            )

        remaining = quantity
        total_cost = Decimal("0.00")
        to_update = []
        to_delete_ids = []

        for purchase in purchases:
            if remaining <= 0:
                break
            take = min(purchase.quantity, remaining)
            total_cost += Decimal(str(take)) * purchase.unit_price
            remaining -= take
            purchase.quantity -= take
            if purchase.quantity == 0:
                to_delete_ids.append(purchase.pk)
            else:
                to_update.append(purchase)

        if to_delete_ids:
            ProductPurchase.objects.filter(pk__in=to_delete_ids).delete()
        if to_update:
            ProductPurchase.objects.bulk_update(to_update, ["quantity"])

        return (total_cost / Decimal(str(quantity))).quantize(Decimal("0.01"))

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        tenant = validated_data["tenant"]

        product_ids = [item["product"] for item in items_data]

        with transaction.atomic():
            products = Product.objects.select_for_update().filter(
                pk__in=product_ids, tenant=tenant
            )
            products_map = {p.pk: p for p in products}

            missing = set(product_ids) - set(products_map.keys())
            if missing:
                raise serializers.ValidationError(
                    {"items": _("Products not found: %(ids)s") % {
                        "ids": ", ".join(str(pk) for pk in missing)
                    }}
                )

            total_amount = Decimal("0.00")
            sale_items = []
            stock_errors = {}

            for item_data in items_data:
                product = products_map[item_data["product"]]
                try:
                    fifo_cost = self._process_fifo_item(product, item_data["quantity"])
                except serializers.ValidationError as exc:
                    stock_errors[product.name] = exc.detail
                    continue

                total_amount += item_data["price"] * item_data["quantity"]
                sale_items.append(
                    SaleItem(
                        product=product,
                        quantity=item_data["quantity"],
                        price=item_data["price"],
                        cost=fifo_cost,
                    )
                )

            if stock_errors:
                raise serializers.ValidationError({"items": stock_errors})

            validated_data["total_amount"] = total_amount
            sale = Sale.objects.create(**validated_data)

            for si in sale_items:
                si.sale = sale
            SaleItem.objects.bulk_create(sale_items)

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
