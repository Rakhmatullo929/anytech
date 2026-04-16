import * as Yup from 'yup';
import { digitsOnly, getClientPhoneRule, type ClientPhoneCountry } from './phone-format';

type Translate = (key: string, options?: Record<string, string | number>) => string;

export function getClientFormSchema(tx: Translate) {
  return Yup.object({
    name: Yup.string().trim().required(tx('validation.client_name_required')),
    lastName: Yup.string().trim(),
    middleName: Yup.string().trim(),
    birthDate: Yup.string().nullable(),
    communicationLanguage: Yup.string().oneOf(['', 'uz', 'ru', 'en']),
    gender: Yup.string().trim(),
    maritalStatus: Yup.string().trim(),
    phones: Yup.array()
      .of(
        Yup.object({
          country: Yup.mixed<ClientPhoneCountry>().oneOf(['uz', 'ru', 'us']).required(),
          number: Yup.string()
            .required(tx('validation.phone_required'))
            .test('phone-local-format', tx('validation.phone_invalid_format', { example: '+998901234567' }), (value, context) => {
              const parent = context.parent as { country?: ClientPhoneCountry };
              const country = parent.country || 'uz';
              const rule = getClientPhoneRule(country);
              return digitsOnly(value || '').length === rule.localLength;
            }),
        })
      )
      .min(1, tx('validation.phone_required'))
      .test('first-phone-required', tx('validation.phone_required'), (value) => Boolean(value?.[0]?.number?.trim())),
    addresses: Yup.array().of(
      Yup.object({
        country: Yup.string().trim(),
        city: Yup.string().trim(),
        address: Yup.string().trim(),
        postalCode: Yup.string().trim(),
        note: Yup.string().trim(),
      })
    ),
    socialNetworks: Yup.object({
      email: Yup.string().trim().email(tx('validation.email_invalid')).nullable(),
      telegram: Yup.string().trim(),
      instagram: Yup.string().trim(),
      facebook: Yup.string().trim(),
    }),
  });
}
