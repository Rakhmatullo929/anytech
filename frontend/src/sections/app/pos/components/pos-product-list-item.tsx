import { memo } from 'react';

import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { useLocales } from 'src/locales';
import type { ProductListItem } from 'src/sections/app/products/api/types';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
  product: ProductListItem;
  onAdd: (product: ProductListItem) => void;
};

// ----------------------------------------------------------------------

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
        // Larger touch target on mobile (desktop keeps compact feel)
        minHeight: { xs: 64, md: 48 },
      }}
    >
      {/* Product info */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {product.sku ? `${product.sku} · ` : ''}
          {tx('pos.stockShort')}: {product.availableQuantity}
        </Typography>
      </Box>

      {/* Price + mobile "+" button */}
      <Box sx={{ ml: 1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="subtitle2">
          {fCurrency(parseFloat(product.averagePurchasePrice))}
        </Typography>

        {/* Quick-add button — mobile only, thumb-reachable */}
        <IconButton
          size="small"
          disabled={outOfStock}
          onClick={(e) => {
            e.stopPropagation(); // prevent double-add from ListItemButton
            onAdd(product);
          }}
          sx={{
            display: { xs: 'flex', md: 'none' },
            color: 'primary.main',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.18) },
            '&:active': { bgcolor: (t) => alpha(t.palette.primary.main, 0.26) },
            width: 38,
            height: 38,
            borderRadius: 1.5,
            flexShrink: 0,
          }}
        >
          <Iconify icon="mingcute:add-line" width={20} />
        </IconButton>
      </Box>
    </ListItemButton>
  );
}

export default memo(PosProductListItem);
