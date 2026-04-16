export type ClientPhoneCountry = 'uz' | 'ru' | 'us';

type PhoneRule = {
  country: ClientPhoneCountry;
  prefix: string;
  localLength: number;
  maskGroups: number[];
};

const PHONE_RULES: Record<ClientPhoneCountry, PhoneRule> = {
  uz: { country: 'uz', prefix: '+998', localLength: 9, maskGroups: [2, 3, 2, 2] },
  ru: { country: 'ru', prefix: '+7', localLength: 10, maskGroups: [3, 3, 2, 2] },
  us: { country: 'us', prefix: '+1', localLength: 10, maskGroups: [3, 3, 4] },
};

export const DEFAULT_PHONE_COUNTRY: ClientPhoneCountry = 'uz';

export function getClientPhoneRule(country: ClientPhoneCountry) {
  return PHONE_RULES[country] ?? PHONE_RULES[DEFAULT_PHONE_COUNTRY];
}

export function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export function formatPhoneLocalInput(value: string, country: ClientPhoneCountry) {
  const rule = getClientPhoneRule(country);
  const digits = digitsOnly(value).slice(0, rule.localLength);
  const parts: string[] = [];
  let index = 0;
  rule.maskGroups.forEach((groupSize) => {
    const part = digits.slice(index, index + groupSize);
    if (part) parts.push(part);
    index += groupSize;
  });
  return parts.join(' ');
}

export function toE164Phone(country: ClientPhoneCountry, localValue: string) {
  const rule = getClientPhoneRule(country);
  const digits = digitsOnly(localValue);
  if (!digits) return '';
  return `${rule.prefix}${digits.slice(0, rule.localLength)}`;
}

export function parseE164Phone(value: string): { country: ClientPhoneCountry; local: string } {
  const normalized = String(value || '').trim().replace(/\s+/g, '');
  const byPrefix = (Object.values(PHONE_RULES) as PhoneRule[]).find((rule) =>
    normalized.startsWith(rule.prefix)
  );

  if (byPrefix) {
    const localRaw = normalized.slice(byPrefix.prefix.length);
    return {
      country: byPrefix.country,
      local: formatPhoneLocalInput(localRaw, byPrefix.country),
    };
  }

  return {
    country: DEFAULT_PHONE_COUNTRY,
    local: formatPhoneLocalInput(normalized, DEFAULT_PHONE_COUNTRY),
  };
}
