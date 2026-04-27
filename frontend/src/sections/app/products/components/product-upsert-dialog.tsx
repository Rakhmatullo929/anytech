import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import { useLocales } from 'src/locales';
import FormProvider, { RHFTextField, RHFUpload } from 'src/components/hook-form';
import { getProductUpsertSchema } from './utils/product-upsert-schema';

type ProductUpsertValues = {
  name: string;
  sku: string;
  images: (File | string)[];
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  loading: boolean;
  initialValues?: ProductUpsertValues;
  onClose: () => void;
  onSubmit: (values: ProductUpsertValues) => void;
};

export default function ProductUpsertDialog({
  open,
  mode,
  loading,
  initialValues,
  onClose,
  onSubmit,
}: Props) {
  const { tx } = useLocales();
  const schema = getProductUpsertSchema(tx, mode);
  const methods = useForm<ProductUpsertValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      sku: '',
      images: [],
    },
  });
  const { reset, handleSubmit, setValue } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      name: initialValues?.name ?? '',
      sku: initialValues?.sku ?? '',
      images: initialValues?.images ?? [],
    });
  }, [
    open,
    reset,
    initialValues?.name,
    initialValues?.sku,
    initialValues?.images,
  ]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === 'create' ? tx('products.dialogs.create.title') : tx('products.dialogs.edit.title')}
      </DialogTitle>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RHFTextField name="name" label={`${tx('common.table.name')} *`} />
            <RHFTextField name="sku" label={tx('common.table.sku')} />
            <RHFUpload
              name="images"
              multiple
              thumbnail
              maxSize={3145728}
              onDrop={(acceptedFiles) => {
                const nextFiles = acceptedFiles ?? [];
                setValue('images', nextFiles, { shouldValidate: true });
              }}
              onRemove={(inputFile) => {
                const current = methods.getValues('images');
                setValue(
                  'images',
                  current.filter((file) => file !== inputFile),
                  { shouldValidate: true }
                );
              }}
              onRemoveAll={() => setValue('images', [], { shouldValidate: true })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{tx('common.actions.cancel')}</Button>
          <Button variant="contained" disabled={loading} type="submit">
            {tx('common.actions.save')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
