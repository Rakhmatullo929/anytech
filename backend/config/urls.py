from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.auth_tenant.urls")),
    path("api/locations/", include("apps.auth_tenant.location_urls")),
    path("api/v1/products/", include("apps.products.urls")),
    path("api/v1/product-purchases/", include("apps.products.product_purchase_urls")),
    path("api/v1/categories/", include("apps.products.category_urls")),
    path("api/v1/clients/", include("apps.clients.urls")),
    path("api/v1/sales/", include("apps.sales.urls")),
    path("api/v1/debts/", include("apps.debts.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/cash-register/", include("apps.cash_register.urls")),
    # OpenAPI schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
