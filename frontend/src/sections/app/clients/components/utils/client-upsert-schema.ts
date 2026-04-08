import * as Yup from 'yup';

type Translate = (key: string) => string;

export function getClientUpsertSchema(tx: Translate) {
  return Yup.object({
    name: Yup.string().trim().required(tx('validation.client_name_required')),
    phone: Yup.string().trim().required(tx('validation.phone_required')),
  });
}
