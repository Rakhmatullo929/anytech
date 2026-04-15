import * as Yup from 'yup';

type Translate = (key: string, options?: Record<string, string | number>) => string;

type Mode = 'create' | 'edit';

export function getUserUpsertSchema(tx: Translate, mode: Mode) {
  return Yup.object({
    name: Yup.string().trim().required(tx('validation.client_name_required')),
    phone: Yup.string().trim().required(tx('validation.phone_required')),
    email: Yup.string().trim().email(tx('validation.email_invalid')).nullable(),
    passportSeriesPrefix: Yup.string()
      .transform((value) => String(value || '').toUpperCase().replace(/[^A-Z]/g, ''))
      .max(2, tx('validation.passport_prefix_invalid'))
      .test('passport-prefix-required-pair', tx('validation.passport_series_required_pair'), function validatePrefix(value) {
        const number = String(this.parent.passportSeriesNumber || '').trim();
        const prefix = String(value || '').trim();
        if (!prefix && !number) return true;
        return Boolean(prefix) && prefix.length === 2;
      }),
    passportSeriesNumber: Yup.string()
      .transform((value) => String(value || '').replace(/\D/g, ''))
      .max(7, tx('validation.passport_number_invalid'))
      .test('passport-number-required-pair', tx('validation.passport_series_required_pair'), function validateNumber(value) {
        const prefix = String(this.parent.passportSeriesPrefix || '').trim();
        const number = String(value || '').trim();
        if (!prefix && !number) return true;
        return Boolean(number) && number.length === 7;
      }),
    gender: Yup.string().oneOf(['male', 'female']).required(tx('validation.gender_required')),
    role: Yup.string().oneOf(['admin', 'manager', 'seller']).required(tx('validation.role_required')),
    password:
      mode === 'create'
        ? Yup.string().required(tx('validation.password_required')).min(6, tx('validation.password_min'))
        : Yup.string()
            .transform((value) => {
              const normalized = String(value || '').trim();
              return normalized === '' ? undefined : normalized;
            })
            .min(6, tx('validation.password_min'))
            .optional(),
    passwordConfirm:
      mode === 'create'
        ? Yup.string()
            .required(tx('validation.password_confirm_required'))
            .oneOf([Yup.ref('password')], tx('validation.passwords_must_match'))
        : Yup.string()
            .trim()
            .test('password-confirm-match', tx('validation.passwords_must_match'), function validatePasswordConfirm(value) {
              const password = String(this.parent.password || '').trim();
              const confirm = String(value || '').trim();
              if (!password && !confirm) return true;
              if (!password && confirm) return false;
              return password === confirm;
            }),
  });
}
