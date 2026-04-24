import * as Yup from 'yup';

type Translate = (key: string, options?: Record<string, string | number>) => string;

export function getGroupFormSchema(tx: Translate) {
  return Yup.object({
    name: Yup.string().trim().required(tx('clients.groups.validation.nameRequired')),
    description: Yup.string().trim(),
  });
}
