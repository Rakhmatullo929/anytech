import * as Yup from 'yup';

type Translate = (key: string) => string;

export function getProductUpsertSchema(tx: Translate, _mode: 'create' | 'edit') {
  return Yup.object({
    name: Yup.string().trim().required(tx('common.validation.productNameRequired')),
    sku: Yup.string().trim(),
    images: Yup.array().of(Yup.mixed<File | string>().required()).optional(),
  });
}
