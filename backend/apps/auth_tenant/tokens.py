from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["tenant_id"] = str(user.tenant_id) if user.tenant_id else None
        token["role"] = user.role
        token["name"] = user.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": str(self.user.id),
            "name": self.user.name,
            "email": self.user.email,
            "role": self.user.role,
            "tenant_id": str(self.user.tenant_id) if self.user.tenant_id else None,
        }
        return data
