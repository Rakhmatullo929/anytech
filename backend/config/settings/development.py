import os

from .base import *  # noqa: F401,F403
from .base import INSTALLED_APPS, MIDDLEWARE

DEBUG = True

ALLOWED_HOSTS = ["*"]

# ---------------------------------------------------------------------------
# Debug toolbar
# ---------------------------------------------------------------------------

INSTALLED_APPS += ["debug_toolbar"]

MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")

INTERNAL_IPS = ["127.0.0.1"]

# In Docker, the gateway IP is dynamic. Use django-debug-toolbar's
# SHOW_TOOLBAR_CALLBACK for Docker environments if needed.

# ---------------------------------------------------------------------------
# Database — PostgreSQL via DATABASE_URL in Docker, SQLite locally
# ---------------------------------------------------------------------------

if not os.environ.get("DATABASE_URL") or "sqlite" in os.environ.get("DATABASE_URL", ""):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

# ---------------------------------------------------------------------------
# Email (console backend for dev)
# ---------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ---------------------------------------------------------------------------
# DRF — add browsable API in dev
# ---------------------------------------------------------------------------

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] += [  # noqa: F405
    "rest_framework.renderers.BrowsableAPIRenderer",
]

# Disable throttling in development / tests
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405

# ---------------------------------------------------------------------------
# CORS — allow all in dev
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = True
