import { useMemo, useState } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
// utils
import { fDateTime } from 'src/utils/format-time';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// components
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';
import EntityDetailHeader from 'src/sections/app/components/entity-detail-header';
import { useProductDetailQuery } from 'src/sections/app/products/api';
import { ProductDetailsSkeleton } from 'src/sections/app/products/skeleton';

// ----------------------------------------------------------------------

const PLACEHOLDER_BG = 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)';

export default function ProductDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data: product, isPending } = useProductDetailQuery(id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = useMemo(() => {
    if (!product) return [];
    return product.images.map((item) => item.image).filter(Boolean);
  }, [product]);

  const hasImages = images.length > 0;
  const clampedIndex = Math.min(activeImageIndex, Math.max(images.length - 1, 0));
  const currentImage = hasImages ? images[clampedIndex] : null;

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
        <EntityDetailHeader
          title={product.name}
          description={`SKU: ${product.sku || '-'}`}
          icon="solar:box-bold"
          chips={[
            {
              icon: 'solar:gallery-bold',
              label: `${images.length} image(s)`,
              variant: 'soft',
            },
            {
              icon: 'solar:calendar-mark-bold',
              label: fDateTime(product.createdAt),
              variant: 'outlined',
            },
          ]}
        />

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="stretch">
          <Card sx={{ flex: 1, p: 2.5 }}>
            <CardHeader
              title={tx('common.table.image')}
              subheader={hasImages ? `${images.length} image(s)` : 'No images'}
              sx={{ px: 0, pt: 0, pb: 2 }}
            />

            <Box
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.neutral',
                minHeight: { xs: 260, md: 380 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentImage ? (
                <Box
                  component="img"
                  src={currentImage}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: { xs: 260, md: 380 },
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Stack alignItems="center" spacing={1.5} sx={{ p: 3, width: '100%', height: '100%', justifyContent: 'center', background: PLACEHOLDER_BG }}>
                  <Iconify icon="solar:gallery-remove-bold" width={52} />
                  <Typography variant="subtitle2">{tx('common.table.noData')}</Typography>
                </Stack>
              )}

              {hasImages ? (
                <>
                  <IconButton
                    onClick={() => setActiveImageIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1))}
                    sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(17,24,39,0.4)', color: 'common.white', '&:hover': { bgcolor: 'rgba(17,24,39,0.6)' } }}
                  >
                    <Iconify icon="eva:arrow-ios-back-fill" />
                  </IconButton>
                  <IconButton
                    onClick={() => setActiveImageIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1))}
                    sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(17,24,39,0.4)', color: 'common.white', '&:hover': { bgcolor: 'rgba(17,24,39,0.6)' } }}
                  >
                    <Iconify icon="eva:arrow-ios-forward-fill" />
                  </IconButton>
                </>
              ) : null}
            </Box>

            {hasImages ? (
              <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', pb: 0.5 }}>
                {images.map((item, idx) => (
                  <Box
                    key={`${item}-${idx}`}
                    onClick={() => setActiveImageIndex(idx)}
                    sx={{
                      width: 76,
                      height: 76,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      border: (theme) =>
                        `2px solid ${idx === clampedIndex ? theme.palette.primary.main : theme.palette.divider}`,
                      flexShrink: 0,
                    }}
                  >
                    <Box component="img" src={item} alt={`${product.name}-${idx + 1}`} sx={{ width: 1, height: 1, objectFit: 'cover' }} />
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Card>

          <Card sx={{ width: { xs: 1, lg: 360 }, p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Product Info
            </Typography>

            <Stack spacing={1.5}>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.name')}
                </Typography>
                <Typography variant="subtitle2">{product.name}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.sku')}
                </Typography>
                <Typography variant="subtitle2">{product.sku || '-'}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.created')}
                </Typography>
                <Typography variant="subtitle2">{fDateTime(product.createdAt)}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tx('common.table.updated')}
                </Typography>
                <Typography variant="subtitle2">{fDateTime(product.updatedAt)}</Typography>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </>
  );
}
