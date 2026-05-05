import { memo } from 'react';

import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import { useLocales } from 'src/locales';
import type { ProductListItem } from 'src/sections/app/products/api/types';
import { fCurrency } from 'src/utils/format-number';

type Props = {
  product: ProductListItem;
  onAdd: (product: ProductListItem) => void;
};

function PosProductListItem({ product, onAdd }: Props) {
  const { tx } = useLocales();
  const outOfStock = product.availableQuantity <= 0;

  return (
    <ListItemButton
      onClick={() => onAdd(product)}
      disabled={outOfStock}
      sx={{
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        opacity: outOfStock ? 0.5 : 1,
      }}
    >
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {product.sku ? `${product.sku} · ` : ''}
          {tx('pos.stockShort')}: {product.availableQuantity}
        </Typography>
      </Box>
      <Typography variant="subtitle2" sx={{ ml: 1, flexShrink: 0 }}>
        {fCurrency(parseFloat(product.averagePurchasePrice))}
      </Typography>
    </ListItemButton>
  );
}

export default memo(PosProductListItem);
