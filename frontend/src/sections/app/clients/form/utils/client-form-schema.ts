import * as Yup from 'yup';
import { digitsOnly, getClientPhoneRule, type ClientPhoneCountry } from './phone-format';

type Translate = (key: string, options?: Record<string, string | number>) => string;

export function getClientFormSchema(tx: Translate) {
  return Yup.object({
    name: Yup.string().trim().required(tx('common.validation.clientNameRequired')),
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
            .required(tx('common.validation.phoneRequired'))
            .test('phone-local-format', tx('common.validation.phoneInvalidFormat', { example: '+998901234567' }), (value, context) => {
              const parent = context.parent as { country?: ClientPhoneCountry };
              const country = parent.country || 'uz';
              const rule = getClientPhoneRule(country);
              return digitsOnly(value || '').length === rule.localLength;
            }),
        })
      )
      .min(1, tx('common.validation.phoneRequired'))
      .test('first-phone-required', tx('common.validation.phoneRequired'), (value) => Boolean(value?.[0]?.number?.trim())),
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
      email: Yup.string().trim().email(tx('common.validation.emailInvalid')).nullable(),
      telegram: Yup.string().trim(),
      instagram: Yup.string().trim(),
      facebook: Yup.string().trim(),
    }),
  });
}
