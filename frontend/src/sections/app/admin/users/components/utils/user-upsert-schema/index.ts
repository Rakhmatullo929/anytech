import * as Yup from 'yup';
import { digitsOnly, getClientPhoneRule, DEFAULT_PHONE_COUNTRY } from 'src/sections/app/clients/form/utils/phone-format';

type Translate = (key: string, options?: Record<string, string | number>) => string;

type Mode = 'create' | 'edit';

export function getUserUpsertSchema(tx: Translate, mode: Mode) {
  return Yup.object({
    firstName: Yup.string().trim().required(tx('common.validation.clientNameRequired')),
    lastName: Yup.string().trim(),
    middleName: Yup.string().trim(),
    birthDate: Yup.string().nullable().required(tx('common.validation.birthDateRequired')),
    regionId: Yup.string().trim().required(tx('common.validation.regionRequired')),
    districtId: Yup.string().trim().required(tx('common.validation.districtRequired')),
    phone: Yup.string()
      .trim()
      .required(tx('common.validation.phoneRequired'))
      .test('phone-local-format', tx('common.validation.phoneInvalidFormat', { example: '+998901234567' }), (value) => {
        const rule = getClientPhoneRule(DEFAULT_PHONE_COUNTRY);
        return digitsOnly(value || '').length === rule.localLength;
      }),
    email: Yup.string().trim().email(tx('common.validation.emailInvalid')).nullable(),
    passportSeriesPrefix: Yup.string()
      .transform((value) => String(value || '').toUpperCase().replace(/[^A-Z]/g, ''))
      .max(2, tx('common.validation.passportPrefixInvalid'))
      .test(
        'passport-prefix-required-pair',
        tx('common.validation.passportSeriesRequiredPair'),
        function validatePrefix(value) {
        const number = String(this.parent.passportSeriesNumber || '').trim();
        const prefix = String(value || '').trim();
        if (!prefix && !number) return true;
        return Boolean(prefix) && prefix.length === 2;
        }
      ),
    passportSeriesNumber: Yup.string()
      .transform((value) => String(value || '').replace(/\D/g, ''))
      .max(7, tx('common.validation.passportNumberInvalid'))
      .test(
        'passport-number-required-pair',
        tx('common.validation.passportSeriesRequiredPair'),
        function validateNumber(value) {
        const prefix = String(this.parent.passportSeriesPrefix || '').trim();
        const number = String(value || '').trim();
        if (!prefix && !number) return true;
        return Boolean(number) && number.length === 7;
        }
      ),
    gender: Yup.string().oneOf(['male', 'female']).required(tx('common.validation.genderRequired')),
    role: Yup.string().trim().required(tx('common.validation.roleRequired')),
    password:
      mode === 'create'
        ? Yup.string()
            .required(tx('common.validation.passwordRequired'))
            .min(6, tx('common.validation.passwordMin'))
        : Yup.string()
            .transform((value) => {
              const normalized = String(value || '').trim();
              return normalized === '' ? undefined : normalized;
            })
            .min(6, tx('common.validation.passwordMin'))
            .optional(),
    passwordConfirm:
      mode === 'create'
        ? Yup.string()
            .required(tx('common.validation.passwordConfirmRequired'))
            .oneOf([Yup.ref('password')], tx('common.validation.passwordsMustMatch'))
        : Yup.string()
            .trim()
            .test(
              'password-confirm-match',
              tx('common.validation.passwordsMustMatch'),
              function validatePasswordConfirm(value) {
              const password = String(this.parent.password || '').trim();
              const confirm = String(value || '').trim();
              if (!password && !confirm) return true;
              if (!password && confirm) return false;
              return password === confirm;
              }
            ),
  });
}
