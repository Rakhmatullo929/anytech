import { useMemo } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// utils
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';
import { useProductDetailQuery } from 'src/sections/app/products/api';
import { ProductDetailsSkeleton } from 'src/sections/app/products/skeleton';

// ----------------------------------------------------------------------

export default function ProductDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data: product, isPending } = useProductDetailQuery(id);

  const initials = useMemo(() => {
    if (!product?.name) return 'P';
    return product.name.charAt(0).toUpperCase();
  }, [product?.name]);
  const marginValue = useMemo(() => {
    if (!product) return 0;
    return Number(product.salePrice) - Number(product.purchasePrice);
  }, [product]);
  const stockColor = useMemo(() => {
    if (!product) return 'default' as const;
    if (product.stock <= 0) return 'error' as const;
    if (product.stock <= 10) return 'warning' as const;
    return 'success' as const;
  }, [product]);

  if (isPending) {
    return (
      <Box>
        <ProductDetailsSkeleton />
      </Box>
    );
  }

  if (!product) {
    return (
      <EmptyContent
        filled
        title={tx('products.detail.notFound')}
        action={
          <Button component={RouterLink} href={paths.products.root} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={product.name}
        links={[
          { name: tx('common.navigation.products'), href: paths.products.root },
          { name: product.name, href: paths.products.details(product.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 700 }}>{initials}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{product.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                SKU: {product.sku || '-'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                variant="soft"
                color={stockColor}
                icon={<Iconify icon="solar:box-bold" />}
                label={`${tx('common.table.stock')}: ${product.stock}`}
              />
              <Chip
                size="small"
                variant="soft"
                color="default"
                icon={<Iconify icon="solar:calendar-bold" />}
                label={fDateTime(product.createdAt)}
              />
            </Stack>
          </Stack>
        </Card>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
          <Card sx={{ p: 2.5, flex: 1, border: (theme) => `1px dashed ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary">
              {tx('common.table.purchase')}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {fCurrency(product.purchasePrice)}
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, flex: 1, border: (theme) => `1px dashed ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary">
              {tx('common.table.salePrice')}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {fCurrency(product.salePrice)}
            </Typography>
          </Card>
          <Card sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Margin
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {fCurrency(String(marginValue))}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              {tx('common.table.created')}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
              {fDateTime(product.createdAt)}
            </Typography>
          </Card>
        </Stack>
      </Stack>
    </>
  );
}
