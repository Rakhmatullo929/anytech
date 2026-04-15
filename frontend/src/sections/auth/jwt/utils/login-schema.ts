import * as Yup from 'yup';

import { getPhonePrefix, getPhoneRule, isPhoneValid, normalizePhone } from 'src/auth/utils/phone-rules';

type Translate = (key: string, options?: Record<string, string | number>) => string;

export function getLoginSchema(tx: Translate) {
  const phoneRule = getPhoneRule();

  return Yup.object({
    phone: Yup.string()
      .required(tx('validation.phone_required'))
      .test('phone-format', tx('validation.phone_invalid_format', { example: phoneRule.example }), (value) =>
        value ? isPhoneValid(normalizeUzLoginPhone(value)) : false
      ),
    password: Yup.string().required(tx('validation.password_required')),
  });
}

export function normalizeLoginPayload(values: { phone: string; password: string }) {
  const normalizedPhone = normalizeUzLoginPhone(values.phone);

  return {
    ...values,
    phone: normalizedPhone,
  };
}

export function formatUzPhoneInput(rawPhone: string): string {
  const localDigits = extractUzLocalDigits(rawPhone).slice(0, 9);
  const p1 = localDigits.slice(0, 2);
  const p2 = localDigits.slice(2, 5);
  const p3 = localDigits.slice(5, 7);
  const p4 = localDigits.slice(7, 9);

  return [p1, p2, p3, p4].filter(Boolean).join(' ');
}

function normalizeUzLoginPhone(rawPhone: string): string {
  const localDigits = extractUzLocalDigits(rawPhone);
  if (localDigits.length === 9) {
    return `${getPhonePrefix()}${localDigits}`;
  }

  const normalized = normalizePhone(rawPhone);
  const prefix = getPhonePrefix();
  const digitsOnly = normalized.replace(/\D/g, '');
  const prefixDigits = prefix.replace(/\D/g, '');

  if (normalized.startsWith(prefix)) {
    return normalized;
  }

  if (digitsOnly.startsWith(prefixDigits) && digitsOnly.length === prefixDigits.length + 9) {
    return `+${digitsOnly}`;
  }

  if (/^\d{9}$/.test(digitsOnly)) {
    return `${prefix}${digitsOnly}`;
  }

  return normalized;
}

function extractUzLocalDigits(rawPhone: string): string {
  const normalized = normalizePhone(rawPhone);
  const digitsOnly = normalized.replace(/\D/g, '');
  const prefixDigits = getPhonePrefix().replace(/\D/g, '');

  if (normalized.startsWith(getPhonePrefix()) && digitsOnly.length >= prefixDigits.length) {
    return digitsOnly.slice(prefixDigits.length, prefixDigits.length + 9);
  }

  if (digitsOnly.startsWith(prefixDigits) && digitsOnly.length >= prefixDigits.length) {
    return digitsOnly.slice(prefixDigits.length, prefixDigits.length + 9);
  }

  return digitsOnly.slice(0, 9);
}
