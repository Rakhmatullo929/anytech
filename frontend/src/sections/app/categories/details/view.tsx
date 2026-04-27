import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import Can from 'src/auth/components/can';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import Scrollbar from 'src/components/scrollbar';
import { TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';
import EntityDetailHeader from 'src/sections/app/components/entity-detail-header';
import { useDebounce } from 'src/hooks/use-debounce';
import { useUrlListState } from 'src/hooks/use-url-query-state';
import { useLocales } from 'src/locales';
import { fDateTime } from 'src/utils/format-time';
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';

import { useCategoryDetailQuery } from 'src/sections/app/categories/api';
import { useProductsListQuery } from 'src/sections/app/products/api';

export default function CategoryDetailsView() {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const { data: category, isPending } = useCategoryDetailQuery(id);

  const {
    page: pageParam,
    rowsPerPage,
    search: searchValue,
    ordering,
    setSearch,
    handlePageChange,
    handleRowsPerPageChange,
  } = useUrlListState({
    pageKey: 'page',
    pageSizeKey: 'page_size',
    searchKey: 'search',
    orderingKey: 'ordering',
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrdering: '-created_at',
  });
  const debouncedSearch = useDebounce(searchValue.trim(), 400);
  const page = Math.max(0, pageParam - 1);

  const productsQuery = useProductsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
    categoryId: id,
  });

  const rows = useMemo(() => productsQuery.data?.results ?? [], [productsQuery.data?.results]);
  const total = productsQuery.data?.count ?? 0;

  if (isPending) {
    return (
      <Card sx={{ p: 3 }}>
        <LinearProgress color="inherit" />
      </Card>
    );
  }

  if (!category) {
    return (
      <EmptyContent
        filled
        title={tx('categories.detail.notFound')}
        action={
          <Button component={RouterLink} href={paths.categories.root} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  const tableHead = [
    { id: 'name', label: tx('common.table.name') },
    { id: 'sku', label: tx('common.table.sku') },
    { id: 'created', label: tx('common.table.created') },
  ];

  return (
    <>
      <CustomBreadcrumbs
        heading={category.name}
        links={[
          { name: tx('common.navigation.categories'), href: paths.categories.root },
          { name: category.name, href: paths.categories.details(category.id) },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <EntityDetailHeader
          title={category.name}
          description={tx('categories.detail.productsHint')}
          icon="solar:tag-price-bold"
          chips={[
            {
              icon: 'solar:box-bold',
              label: tx('categories.detail.productsCount', { count: total }),
              variant: 'soft',
            },
            {
              icon: 'solar:calendar-mark-bold',
              label: fDateTime(category.createdAt),
              variant: 'outlined',
            },
          ]}
        />

        <Card sx={{ p: 2 }}>
          <Stack spacing={0.5} sx={{ px: 2, pt: 1 }}>
            <Typography variant="subtitle1">{tx('categories.detail.productsTitle')}</Typography>
          </Stack>

          {productsQuery.isFetching && productsQuery.data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              size="small"
              placeholder={tx('products.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ maxWidth: 360, px: 2 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom headLabel={tableHead} rowCount={rows.length} />
                <TableBody>
                  {rows.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Can
                          page="products"
                          action="detail"
                          fallback={<Typography variant="subtitle2">{product.name}</Typography>}
                        >
                          <Link component={RouterLink} href={paths.products.details(product.id)} variant="subtitle2">
                            {product.name}
                          </Link>
                        </Can>
                      </TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{fDateTime(product.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  <TableNoData notFound={!rows.length} title={tx('common.table.noData')} />
                </TableBody>
              </Table>
            </Scrollbar>

            <Stack sx={{ px: 2, pb: 2 }}>
              <TablePaginationCustom
                count={total}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 15, 25]}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
