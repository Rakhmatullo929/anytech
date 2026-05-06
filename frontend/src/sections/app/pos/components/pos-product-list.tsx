import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { useLocales } from 'src/locales';
import type { ProductListItem } from 'src/sections/app/products/api/types';

import PosProductListItem from './pos-product-list-item';

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
    <Card sx={{ flex: 1, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {tx('pos.productsHeading')}
      </Typography>

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
        sx={{ mb: 2 }}
      />

      {isFetching && (
        <LinearProgress sx={{ mb: 1, borderRadius: 1 }} color="inherit" />
      )}

      <Stack spacing={0.5}>
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
