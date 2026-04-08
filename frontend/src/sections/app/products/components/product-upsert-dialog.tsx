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
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { getProductUpsertSchema } from './utils/product-upsert-schema';

type ProductUpsertValues = {
  name: string;
  sku: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
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
      purchasePrice: '',
      salePrice: '',
      stock: '',
    },
  });
  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      name: initialValues?.name ?? '',
      sku: initialValues?.sku ?? '',
      purchasePrice: initialValues?.purchasePrice ?? '',
      salePrice: initialValues?.salePrice ?? '',
      stock: initialValues?.stock ?? '',
    });
  }, [
    open,
    reset,
    initialValues?.name,
    initialValues?.sku,
    initialValues?.purchasePrice,
    initialValues?.salePrice,
    initialValues?.stock,
  ]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === 'create' ? tx('pages.products.dialogs.create.title') : tx('pages.products.dialogs.edit.title')}
      </DialogTitle>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RHFTextField name="name" label={`${tx('shared.table.name')} *`} />
            <RHFTextField name="sku" label={tx('shared.table.sku')} />
            <RHFTextField name="purchasePrice" label={`${tx('pages.products.dialogs.create.purchase_price')} *`} />
            <RHFTextField name="salePrice" label={`${tx('pages.products.dialogs.create.sale_price')} *`} />
            {mode === 'create' ? (
              <RHFTextField name="stock" label={`${tx('pages.products.dialogs.create.initial_stock')} *`} />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
          <Button variant="contained" disabled={loading} type="submit">
            {tx('shared.actions.save')}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
