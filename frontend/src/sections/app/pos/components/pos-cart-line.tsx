import { memo, useEffect } from 'react';
import { useController, useForm } from 'react-hook-form';

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

type FormValues = { qty: string; price: string };

function PosCartLine({ line, onSetQty, onSetPrice, onRemove }: Props) {
  const { tx } = useLocales();

  const { control, reset, setError, clearErrors } = useForm<FormValues>({
    defaultValues: { qty: String(line.quantity), price: String(line.unitPrice) },
  });

  const { field: qtyField, fieldState: qtyState } = useController({ name: 'qty', control });
  const { field: priceField, fieldState: priceState } = useController({ name: 'price', control });

  // Sync display when cart state changes externally (e.g. tapping product again)
  useEffect(() => {
    reset({ qty: String(line.quantity), price: String(line.unitPrice) });
  }, [line.quantity, line.unitPrice, reset]);

  // ── Qty ──────────────────────────────────────────────────────────────

  const validateQty = (raw: string): string | null => {
    const n = parseInt(raw, 10);
    if (!raw || Number.isNaN(n) || n < 1) return tx('pos.validation.qtyMin');
    if (n > line.availableStock) return tx('pos.validation.qtyExceedsStock', { max: line.availableStock });
    return null;
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip anything that isn't a digit
    const filtered = e.target.value.replace(/\D/g, '');
    qtyField.onChange(filtered);
    const err = validateQty(filtered);
    if (err) setError('qty', { message: err });
    else clearErrors('qty');
  };

  const commitQty = () => {
    const err = validateQty(qtyField.value);
    if (err) {
      // Invalid on blur → snap back to last committed value
      reset({ qty: String(line.quantity), price: priceField.value });
      clearErrors('qty');
      return;
    }
    onSetQty(line.productId, parseInt(qtyField.value, 10));
  };

  // ── Price ─────────────────────────────────────────────────────────────

  const validatePrice = (raw: string): string | null => {
    if (!raw || raw === '.') return tx('pos.validation.priceInvalid');
    const n = parseFloat(raw);
    if (Number.isNaN(n) || n < 0) return tx('pos.validation.priceMin');
    return null;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits and a single decimal point
    const filtered = e.target.value
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');
    priceField.onChange(filtered);
    const err = validatePrice(filtered);
    if (err) setError('price', { message: err });
    else clearErrors('price');
  };

  const commitPrice = () => {
    const err = validatePrice(priceField.value);
    if (err) {
      reset({ qty: qtyField.value, price: String(line.unitPrice) });
      clearErrors('price');
      return;
    }
    onSetPrice(line.productId, parseFloat(priceField.value));
  };

  // ── Helpers ───────────────────────────────────────────────────────────

  const onKeyDown = (commit: () => void) => (e: React.KeyboardEvent) => {
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
        <IconButton size="small" color="error" onClick={() => onRemove(line.productId)} sx={{ flexShrink: 0 }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField
          {...qtyField}
          size="small"
          label={tx('common.table.qty')}
          inputProps={{ inputMode: 'numeric' }}
          error={!!qtyState.error}
          helperText={qtyState.error?.message}
          onChange={handleQtyChange}
          onBlur={commitQty}
          onKeyDown={onKeyDown(commitQty)}
          sx={{ flex: 1 }}
        />
        <TextField
          {...priceField}
          size="small"
          label={tx('common.table.price')}
          inputProps={{ inputMode: 'decimal' }}
          error={!!priceState.error}
          helperText={priceState.error?.message}
          onChange={handlePriceChange}
          onBlur={commitPrice}
          onKeyDown={onKeyDown(commitPrice)}
          sx={{ flex: 1.4 }}
        />
      </Stack>
    </Stack>
  );
}

export default memo(PosCartLine);
