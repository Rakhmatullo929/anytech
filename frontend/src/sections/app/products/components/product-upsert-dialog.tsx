import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';

import { useLocales } from 'src/locales';
import FormProvider, { RHFSelect, RHFTextField, RHFUpload } from 'src/components/hook-form';
import { getProductUpsertSchema } from './utils/product-upsert-schema';

type ProductUpsertValues = {
  name: string;
  sku: string;
  category: string;
  images: (File | string)[];
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  loading: boolean;
  categories: { id: string; name: string }[];
  initialValues?: ProductUpsertValues;
  onClose: () => void;
  onSubmit: (values: ProductUpsertValues) => void;
};

export default function ProductUpsertDialog({
  open,
  mode,
  loading,
  categories,
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
      category: '',
      images: [],
    },
  });
  const { reset, handleSubmit, setValue } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      name: initialValues?.name ?? '',
      sku: initialValues?.sku ?? '',
      category: initialValues?.category ?? '',
      images: initialValues?.images ?? [],
    });
  }, [
    open,
    reset,
    initialValues?.name,
    initialValues?.sku,
    initialValues?.category,
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
            <RHFSelect name="category" label={tx('common.table.category')}>
              <MenuItem value="">{tx('common.table.allOption')}</MenuItem>
              {categories.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </RHFSelect>
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
