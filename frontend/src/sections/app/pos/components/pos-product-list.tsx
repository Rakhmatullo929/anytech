import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { HEADER } from 'src/layouts/config-layout';
import { useLocales } from 'src/locales';
import type { ProductListItem } from 'src/sections/app/products/api/types';

import PosProductListItem from './pos-product-list-item';

// ----------------------------------------------------------------------

type Props = {
  products: ProductListItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onAddProduct: (product: ProductListItem) => void;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  observerRef: (el: HTMLElement | null) => void;
};

// ----------------------------------------------------------------------

export default function PosProductList({
  products,
  search,
  onSearchChange,
  onAddProduct,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  observerRef,
}: Props) {
  const { tx } = useLocales();

  return (
    <Card
      sx={{
        flex: 1,
        p: 2,
        // Desktop: column flex container so the product list can fill
        // remaining height and scroll independently.
        display: { md: 'flex' },
        flexDirection: { md: 'column' },
        // Clamp height to viewport on desktop so only the product list
        // scrolls. Offsets: page py (HEADER.H + 8) × 2 + breadcrumbs (~80px
        // heading + 40px mb) + tabs (~48px + 24px mb) = 192px above-content.
        maxHeight: {
          md: `calc(100vh - ${(HEADER.H_MOBILE + 8) * 2 + 192}px)`,
          lg: `calc(100vh - ${(HEADER.H_DESKTOP + 8) * 2 + 192}px)`,
        },
        // Flat, full-bleed appearance on mobile/tablet — the parent Box in
        // view.tsx already extends the card edge-to-edge using mx:-2.
        borderRadius: { xs: 0, md: 2 },
        '@media (max-width: 899px)': { boxShadow: 'none' },
        // overflow:visible lets position:sticky work on mobile
        // (Card/Paper default overflow:hidden breaks it).
        overflow: { xs: 'visible', md: 'hidden' },
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {tx('pos.productsHeading')}
      </Typography>

      {/*
       * Sticky search — sticks to the top of the viewport while the page
       * scrolls. Card has overflow:visible on mobile so sticky works.
       * No negative margins: Card already has equal p:2 on both sides, so
       * the paper background naturally covers the full width when sticky.
       */}
      <Box
        sx={{
          position: { xs: 'sticky', md: 'static' },
          top: 0,
          zIndex: { xs: 10, md: 'auto' },
          bgcolor: 'background.paper',
          pb: { xs: 1, md: 0 },
          pt: { xs: 0.5, md: 0 },
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder={tx('pos.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />
            ),
          }}
          sx={{ mb: { xs: 1, md: 2 } }}
        />

        {isFetching && (
          <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
        )}
      </Box>

      {/* Product list — fills remaining card height on desktop and scrolls
          internally; extra bottom padding on mobile so the FAB doesn't
          cover the last item */}
      <Stack
        spacing={0.5}
        sx={{
          pb: { xs: 10, md: 0 },
          // Desktop: grow to fill remaining card height and scroll.
          // min-height:0 lets flex shrink below content size so overflow-y works.
          flex: { md: 1 },
          overflowY: { md: 'auto' },
          minHeight: { md: 0 },
        }}
      >
        {products.map((product) => (
          <PosProductListItem key={product.id} product={product} onAdd={onAddProduct} />
        ))}

        {!products.length && !isFetching && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            {tx('common.table.noData')}
          </Typography>
        )}

        {hasNextPage && (
          <Box ref={observerRef} sx={{ py: 1.5, display: 'flex', justifyContent: 'center' }}>
            {isFetchingNextPage && <CircularProgress size={22} color="inherit" />}
          </Box>
        )}
      </Stack>
    </Card>
  );
}
