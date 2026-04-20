import pytest
from django.urls import reverse, reverse_lazy

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _disable_throttles(settings):
    """Bypass DRF throttles — this file fires many POSTs at /register/ and
    would otherwise flake under pytest-xdist or repeated runs in the same minute."""
    settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": []}


REGISTER_URL = reverse_lazy("auth-register")
BAD_PAYLOAD = {
    "tenant_name": "T",
    "name": "N",
    "phone": "not-a-valid-phone",
    "password": "StrongPass123!",
    "password_confirm": "StrongPass123!",
}


class TestAPILocaleMiddleware:
    def test_ru_query_param_returns_russian(self, anon_client):
        resp = anon_client.post(f"{REGISTER_URL}?lang=ru", BAD_PAYLOAD, format="json")
        assert resp.status_code == 400
        body = resp.content.decode("utf-8")
        assert "формату" in body or "должен" in body, body
        assert resp.headers.get("Content-Language") == "ru"

    def test_uz_query_param_returns_uzbek(self, anon_client):
        resp = anon_client.post(f"{REGISTER_URL}?lang=uz", BAD_PAYLOAD, format="json")
        assert resp.status_code == 400
        body = resp.content.decode("utf-8")
        assert "formatiga" in body or "kerak" in body, body
        assert resp.headers.get("Content-Language") == "uz"

    def test_unsupported_lang_falls_back_to_default(self, anon_client):
        resp = anon_client.post(f"{REGISTER_URL}?lang=xyz", BAD_PAYLOAD, format="json")
        assert resp.status_code == 400
        assert resp.headers.get("Content-Language") == "uz"

    def test_no_lang_param_uses_default(self, anon_client):
        resp = anon_client.post(REGISTER_URL, BAD_PAYLOAD, format="json")
        assert resp.status_code == 400
        assert resp.headers.get("Content-Language") == "uz"

    def test_accept_language_header_fallback(self, anon_client):
        """When no ?lang= is present, Accept-Language is used (standard Django resolution)."""
        resp = anon_client.post(
            REGISTER_URL, BAD_PAYLOAD, format="json", HTTP_ACCEPT_LANGUAGE="ru"
        )
        assert resp.status_code == 400
        body = resp.content.decode("utf-8")
        assert "формату" in body or "должен" in body, body
        assert resp.headers.get("Content-Language") == "ru"

    def test_query_param_wins_over_accept_language(self, anon_client):
        """?lang= takes precedence over Accept-Language."""
        resp = anon_client.post(
            f"{REGISTER_URL}?lang=uz",
            BAD_PAYLOAD,
            format="json",
            HTTP_ACCEPT_LANGUAGE="ru",
        )
        assert resp.status_code == 400
        body = resp.content.decode("utf-8")
        assert "formatiga" in body or "kerak" in body, body
        assert resp.headers.get("Content-Language") == "uz"

    def test_drf_default_error_translated_ru(self, anon_client):
        resp = anon_client.post(f"{REGISTER_URL}?lang=ru", {}, format="json")
        assert resp.status_code == 400
        body = resp.content.decode("utf-8")
        assert "Обязательное поле" in body, body

    def test_drf_default_error_translated_uz(self, anon_client):
        resp = anon_client.post(f"{REGISTER_URL}?lang=uz", {}, format="json")
        assert resp.status_code == 400
        body = resp.content.decode("utf-8")
        assert "to'ldirilishi" in body or "shart" in body, body


class TestRoleLabelsTranslated:
    def test_roles_endpoint_returns_russian_labels(self, admin_client):
        resp = admin_client.get(f"{reverse('auth-roles')}?lang=ru")
        assert resp.status_code == 200
        body = resp.content.decode("utf-8")
        assert "Администратор" in body
        assert "Менеджер" in body
        assert "Продавец" in body

    def test_roles_endpoint_returns_uzbek_labels(self, admin_client):
        resp = admin_client.get(f"{reverse('auth-roles')}?lang=uz")
        assert resp.status_code == 200
        body = resp.content.decode("utf-8")
        assert "Administrator" in body
        assert "Menejer" in body
        assert "Sotuvchi" in body
