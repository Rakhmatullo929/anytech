import * as Yup from 'yup';

type Translate = (key: string) => string;

function numericStringSchema(requiredMessage: string, invalidMessage: string, minMessage: string) {
  return Yup.string()
    .required(requiredMessage)
    .test('is-number', invalidMessage, (value) => !Number.isNaN(Number(value)))
    .test('min-zero', minMessage, (value) => Number(value) >= 0);
}

export function getProductUpsertSchema(tx: Translate, mode: 'create' | 'edit') {
  return Yup.object({
    name: Yup.string().trim().required(tx('common.validation.productNameRequired')),
    sku: Yup.string().trim(),
    purchasePrice: numericStringSchema(
      tx('common.validation.purchasePriceRequired'),
      tx('common.validation.numberInvalid'),
      tx('common.validation.numberMinZero')
    ),
    salePrice: numericStringSchema(
      tx('common.validation.salePriceRequired'),
      tx('common.validation.numberInvalid'),
      tx('common.validation.numberMinZero')
    ),
    stock:
      mode === 'create'
        ? numericStringSchema(
            tx('common.validation.stockRequired'),
            tx('common.validation.numberInvalid'),
            tx('common.validation.numberMinZero')
          )
        : Yup.string().optional(),
  });
}
