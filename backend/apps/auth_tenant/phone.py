import re
from dataclasses import dataclass

from django.conf import settings


@dataclass(frozen=True)
class PhoneRule:
    code: str
    pattern: str
    example: str


DEFAULT_PHONE_RULES = {
    "uz": PhoneRule(
        code="uz",
        pattern=r"^\+998\d{9}$",
        example="+998901234567",
    )
}


def normalize_phone(value: str) -> str:
    return value.strip().replace(" ", "")


def get_default_phone_country() -> str:
    raw = getattr(settings, "AUTH_DEFAULT_PHONE_COUNTRY", "uz")
    return str(raw).lower()


def get_phone_rule(country: str | None = None) -> PhoneRule:
    selected = (country or get_default_phone_country()).lower()
    return DEFAULT_PHONE_RULES.get(selected, DEFAULT_PHONE_RULES["uz"])


def is_phone_valid(value: str, country: str | None = None) -> bool:
    rule = get_phone_rule(country)
    return bool(re.fullmatch(rule.pattern, normalize_phone(value)))
