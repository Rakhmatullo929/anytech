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
    name: Yup.string().trim().required(tx('validation.product_name_required')),
    sku: Yup.string().trim(),
    purchasePrice: numericStringSchema(
      tx('validation.purchase_price_required'),
      tx('validation.number_invalid'),
      tx('validation.number_min_zero')
    ),
    salePrice: numericStringSchema(
      tx('validation.sale_price_required'),
      tx('validation.number_invalid'),
      tx('validation.number_min_zero')
    ),
    stock:
      mode === 'create'
        ? numericStringSchema(
            tx('validation.stock_required'),
            tx('validation.number_invalid'),
            tx('validation.number_min_zero')
          )
        : Yup.string().optional(),
  });
}
