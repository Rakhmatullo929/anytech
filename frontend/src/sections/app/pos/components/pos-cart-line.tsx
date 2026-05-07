import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';

import type { CartLine } from '../api/types';

type Props = {
  line: CartLine;
  onSetQty: (productId: string, qty: number) => void;
  onSetPrice: (productId: string, price: number) => void;
  onRemove: (productId: string) => void;
};

type FormValues = {
  qty: string;
  price: string;
};

function PosCartLine({ line, onSetQty, onSetPrice, onRemove }: Props) {
  const { tx } = useLocales();

  const { register, reset, getValues } = useForm<FormValues>({
    defaultValues: {
      qty: String(line.quantity),
      price: String(line.unitPrice),
    },
  });

  // Sync display when cart state changes externally (e.g. add same product again)
  useEffect(() => {
    reset({ qty: String(line.quantity), price: String(line.unitPrice) });
  }, [line.quantity, line.unitPrice, reset]);

  const commitQty = () => {
    const n = parseInt(getValues('qty'), 10);
    if (!Number.isNaN(n) && n >= 1) {
      onSetQty(line.productId, n);
    } else {
      reset({ qty: String(line.quantity), price: getValues('price') });
    }
  };

  const commitPrice = () => {
    const n = parseFloat(getValues('price'));
    if (!Number.isNaN(n) && n >= 0) {
      onSetPrice(line.productId, n);
    } else {
      reset({ qty: getValues('qty'), price: String(line.unitPrice) });
    }
  };

  const onEnter = (commit: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {line.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {fCurrency(line.unitPrice)} × {line.quantity} = {fCurrency(line.unitPrice * line.quantity)}
          </Typography>
        </Box>
        <IconButton
          size="small"
          color="error"
          onClick={() => onRemove(line.productId)}
          sx={{ flexShrink: 0 }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          {...register('qty')}
          size="small"
          label={tx('common.table.qty')}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          onBlur={commitQty}
          onKeyDown={onEnter(commitQty)}
          sx={{ flex: 1 }}
        />
        <TextField
          {...register('price')}
          size="small"
          label={tx('common.table.price')}
          inputProps={{ inputMode: 'decimal' }}
          onBlur={commitPrice}
          onKeyDown={onEnter(commitPrice)}
          sx={{ flex: 1.4 }}
        />
      </Stack>
    </Stack>
  );
}

export default memo(PosCartLine);
