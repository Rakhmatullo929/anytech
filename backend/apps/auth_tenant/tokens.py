from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .permissions import get_user_permissions


def build_display_name(user):
    return " ".join(
        part for part in [user.first_name, user.last_name, user.middle_name] if part
    )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        display_name = build_display_name(user)
        token["tenant_id"] = str(user.tenant_id) if user.tenant_id else None
        token["role"] = user.role
        token["name"] = display_name
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["middle_name"] = user.middle_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        display_name = build_display_name(self.user)
        data["user"] = {
            "id": str(self.user.id),
            "name": display_name,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "middle_name": self.user.middle_name,
            "phone": self.user.phone,
            "email": self.user.email,
            "role": self.user.role,
            "tenant_id": str(self.user.tenant_id) if self.user.tenant_id else None,
            "permissions": sorted(get_user_permissions(self.user)),
        }
        return data
