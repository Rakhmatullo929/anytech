from django.utils.translation import gettext as _
from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "tenant",
            "name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class CategoryBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )


class CategoryReferenceField(serializers.PrimaryKeyRelatedField):
    def to_representation(self, value):
        if value is None:
            return None
        if not hasattr(value, "name"):
            category_pk = getattr(value, "pk", value)
            value = self.get_queryset().get(pk=category_pk)
        return {
            "id": str(value.id),
            "name": value.name,
        }


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "position")
        read_only_fields = ("id", "position")


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField(read_only=True)
    category = CategoryReferenceField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
        allow_empty=True,
    )

    def validate_sku(self, value):
        if value is not None:
            value = value.strip()
        return value or None

    def validate_category(self, value):
        if value is None:
            return value
        request = self.context.get("request")
        if not request or value.tenant_id != request.user.tenant_id:
            raise serializers.ValidationError(_("Category not found."))
        return value

    def get_image(self, obj):
        first_image = obj.images.first()
        return first_image.image.url if first_image else None

    def _replace_images(self, product: Product, files):
        product.images.all().delete()
        if not files:
            return
        ProductImage.objects.bulk_create(
            [
                ProductImage(product=product, image=file, position=index)
                for index, file in enumerate(files)
            ]
        )

    def create(self, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", [])
        product = super().create(validated_data)
        self._replace_images(product, uploaded_images)
        return product

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", None)
        product = super().update(instance, validated_data)
        if uploaded_images is not None:
            self._replace_images(product, uploaded_images)
        return product

    class Meta:
        model = Product
        fields = (
            "id",
            "tenant",
            "category",
            "name",
            "sku",
            "image",
            "images",
            "uploaded_images",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class ProductListSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = (
            "id",
            "tenant",
            "category",
            "name",
            "sku",
            "image",
            "created_at",
            "updated_at",
        )


class ProductDetailSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = (
            "id",
            "tenant",
            "category",
            "name",
            "sku",
            "images",
            "created_at",
            "updated_at",
        )


class ProductUpdateSerializer(ProductSerializer):
    pass


class ProductBulkDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )
