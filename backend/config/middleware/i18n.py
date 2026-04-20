import logging

from django.conf import settings
from django.utils import translation

logger = logging.getLogger(__name__)


class APILocaleMiddleware:
    """
    Activates translation for the request lifecycle.

    Resolution order:
      1. `?lang=` query parameter (frontend sends this on every API call).
      2. Django's standard resolution (session → cookie → Accept-Language)
         via `translation.get_language_from_request`. Used by admin.
      3. `settings.LANGUAGE_CODE` fallback.

    Unsupported `?lang=xyz` silently falls through to step 2, so stale
    frontend localStorage values never surface as HTTP errors. A DEBUG
    log is emitted to aid diagnosing client/server language mismatches.

    Replaces `django.middleware.locale.LocaleMiddleware` — do not list both.
    """

    QUERY_PARAM = "lang"

    def __init__(self, get_response):
        self.get_response = get_response
        self.supported = {code for code, _ in settings.LANGUAGES}

    def _resolve(self, request):
        lang = request.GET.get(self.QUERY_PARAM)
        if lang:
            if lang in self.supported:
                return lang
            logger.debug(
                "Unsupported ?lang=%r (supported: %s); falling back to request-based resolution",
                lang,
                sorted(self.supported),
            )
        return translation.get_language_from_request(request, check_path=False)

    def __call__(self, request):
        lang = self._resolve(request)
        with translation.override(lang):
            request.LANGUAGE_CODE = lang
            response = self.get_response(request)
        response.setdefault("Content-Language", lang)
        return response
