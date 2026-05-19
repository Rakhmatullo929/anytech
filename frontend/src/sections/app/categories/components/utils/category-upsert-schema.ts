import * as Yup from 'yup';

type Translate = (key: string) => string;

export function getCategoryUpsertSchema(tx: Translate) {
  return Yup.object({
    name: Yup.string().trim().required(tx('common.validation.categoryNameRequired')),
  });
}
