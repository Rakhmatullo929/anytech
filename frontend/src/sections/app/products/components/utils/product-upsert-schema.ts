import * as Yup from 'yup';

type Translate = (key: string) => string;

export function getProductUpsertSchema(tx: Translate, _mode: 'create' | 'edit') {
  return Yup.object({
    name: Yup.string().trim().required(tx('common.validation.productNameRequired')),
    sku: Yup.string().trim(),
    category: Yup.string().nullable().optional(),
    salePrice: Yup.string()
      .required(tx('common.validation.salePriceRequired'))
      .test('is-non-negative', tx('common.validation.numberMinZero'), (value) => {
        if (!value) return false;
        const num = parseFloat(value);
        return !Number.isNaN(num) && num >= 0;
      }),
    images: Yup.array().of(Yup.mixed<File | string>().required()).optional(),
  });
}
