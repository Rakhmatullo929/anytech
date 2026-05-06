import { memo } from 'react';

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

function PosCartLine({ line, onSetQty, onSetPrice, onRemove }: Props) {
  const { tx } = useLocales();

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
          type="number"
          size="small"
          label={tx('common.table.qty')}
          value={line.quantity}
          onChange={(e) => onSetQty(line.productId, Number(e.target.value))}
          inputProps={{ min: 1, max: line.availableStock }}
          sx={{ flex: 1 }}
        />
        <TextField
          type="number"
          size="small"
          label={tx('common.table.price')}
          value={line.unitPrice}
          onChange={(e) => onSetPrice(line.productId, Number(e.target.value))}
          inputProps={{ min: 0 }}
          sx={{ flex: 1.4 }}
        />
      </Stack>
    </Stack>
  );
}

export default memo(PosCartLine);
