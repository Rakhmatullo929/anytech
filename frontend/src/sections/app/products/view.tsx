import { useEffect, useMemo, useState, type MouseEvent } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
// utils
import { fCurrency } from 'src/utils/format-number';
import { useDebounce } from 'src/hooks/use-debounce';
import { useUrlListState, useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSnackbar } from 'src/components/snackbar';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';
import {
  useBulkDeleteProductsMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsListQuery,
  useUpdateProductMutation,
  type ProductListItem,
} from 'src/sections/app/products/api';
import { ProductUpsertDialog } from 'src/sections/app/products/components';
import { ProductsListSkeleton } from 'src/sections/app/products/skeleton';

// ----------------------------------------------------------------------

export default function ProductsView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const bulkDeleteMutation = useBulkDeleteProductsMutation();

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('common.table.name') },
      { id: 'sku', label: tx('common.table.sku') },
      { id: 'stock', label: tx('common.table.stock') },
      { id: 'purchase', label: tx('common.table.purchase') },
      { id: 'sale', label: tx('common.table.salePrice') },
      { id: '', label: '' },
    ],
    [tx]
  );

  const {
    page: pageParam,
    rowsPerPage,
    search: searchValue,
    ordering,
    setSearch,
    setValues: setQueryState,
    handlePageChange,
    handleRowsPerPageChange,
  } = useUrlListState({
    pageKey: 'page',
    pageSizeKey: 'page_size',
    searchKey: 'search',
    orderingKey: 'ordering',
    defaultPage: 1,
    defaultPageSize: 15,
    defaultOrdering: '-created_at',
  });
  const debouncedSearch = useDebounce(searchValue.trim(), 400);

  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  const { data, isPending, isFetching } = useProductsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
  });
  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { selected: selectedIds, setSelected } = table;

  useEffect(() => {
    const rowIdSet = new Set(rows.map((row) => row.id));
    const nextSelected = selectedIds.filter((id) => rowIdSet.has(id));
    if (nextSelected.length !== selectedIds.length) {
      setSelected(nextSelected);
    }
  }, [rows, selectedIds, setSelected]);

  useSyncTableWithUrlListState({
    page: pageParam,
    rowsPerPage,
    tablePage: table.page,
    tableRowsPerPage: table.rowsPerPage,
    setTablePage: setPage,
    setTableRowsPerPage: setRowsPerPage,
  });

  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) {
      setSelectedProductId(null);
    }
  };

  const handleCloseActions = () => closeActions();

  const openActions = (event: MouseEvent<HTMLElement>, productId: string) => {
    setSelectedProductId(productId);
    actionsPopover.onOpen(event);
  };

  const handleEdit = () => {
    if (!selectedProductId) return;
    const product = rows.find((row) => row.id === selectedProductId);
    if (!product) {
      closeActions();
      return;
    }
    setEditingProduct(product);
    setUpsertMode('edit');
    setUpsertOpen(true);
    closeActions(false);
  };

  const handleAskDelete = () => {
    closeActions(false);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedProductId(null);
  };

  const handleOpenBulkDelete = () => {
    setBulkDeleteOpen(true);
  };

  const handleCloseBulkDelete = () => {
    setBulkDeleteOpen(false);
  };

  const handleOpenCreate = () => {
    setUpsertMode('create');
    setEditingProduct(null);
    setUpsertOpen(true);
  };

  const handleCloseUpsert = () => {
    setUpsertOpen(false);
    setEditingProduct(null);
    setSelectedProductId(null);
  };

  const handleDelete = async () => {
    if (!selectedProductId) return;
    try {
      await deleteMutation.mutateAsync(selectedProductId);
      enqueueSnackbar(tx('products.toasts.deleted'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    } finally {
      handleCloseDelete();
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      enqueueSnackbar(tx('products.toasts.bulkDeleted', { count: selectedIds.length }), {
        variant: 'success',
      });
      table.onUpdatePageDeleteRows({
        totalRows: total,
        totalRowsInPage: rows.length,
        totalRowsFiltered: total,
      });
      table.setSelected([]);
      handleCloseBulkDelete();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitUpsert = async (values: {
    name: string;
    sku: string;
    purchasePrice: string;
    salePrice: string;
    stock: string;
  }) => {
    const normalizedName = values.name.trim();
    const normalizedPurchase = values.purchasePrice.trim();
    const normalizedSale = values.salePrice.trim();
    const normalizedSku = values.sku.trim();
    const parsedStock = Number(values.stock);

    if (!normalizedName || !normalizedPurchase || !normalizedSale) {
      enqueueSnackbar(tx('products.toasts.requiredFields'), { variant: 'warning' });
      return;
    }

    if (
      Number.isNaN(Number(normalizedPurchase)) ||
      Number.isNaN(Number(normalizedSale)) ||
      Number(normalizedPurchase) < 0 ||
      Number(normalizedSale) < 0
    ) {
      enqueueSnackbar(tx('products.toasts.invalidPrices'), { variant: 'warning' });
      return;
    }

    if (upsertMode === 'create' && (Number.isNaN(parsedStock) || parsedStock < 0)) {
      enqueueSnackbar(tx('products.toasts.invalidStock'), { variant: 'warning' });
      return;
    }

    try {
      if (upsertMode === 'create') {
        await createMutation.mutateAsync({
          name: normalizedName,
          sku: normalizedSku || undefined,
          purchasePrice: normalizedPurchase,
          salePrice: normalizedSale,
          stock: parsedStock,
        });
        enqueueSnackbar(tx('products.toasts.created'), { variant: 'success' });
      } else if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          name: normalizedName,
          sku: normalizedSku || undefined,
          purchasePrice: normalizedPurchase,
          salePrice: normalizedSale,
        });
        enqueueSnackbar(tx('products.toasts.updated'), { variant: 'success' });
      }
      handleCloseUpsert();
      setPage(0);
      setQueryState({ page: 1, search: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const upsertLoading = createMutation.isPending || updateMutation.isPending;
  const deletingCurrent =
    deleteMutation.isPending &&
    selectedProductId !== null &&
    deleteMutation.variables === selectedProductId;
  const deletingBulk = bulkDeleteMutation.isPending;
  const canWriteProducts = canWritePage('products');

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.products')}
        links={[{ name: tx('common.navigation.products'), href: paths.products.root }]}
        action={
          <Can page="products" action="write">
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
              {tx('products.addButton')}
            </Button>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {showInitialLoader ? (
        <ProductsListSkeleton headLabel={tableHead} />
      ) : (
        <Card>
          {isFetching && data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ p: 2 }}>
            <Can page="products" action="write">
              <TableSelectedAction
                numSelected={selectedIds.length}
                rowCount={rows.length}
                onSelectAllRows={(checked) => table.onSelectAllRows(checked, rows.map((row) => row.id))}
                action={
                  <Button color="error" onClick={handleOpenBulkDelete}>
                    {tx('common.actions.delete')}
                  </Button>
                }
              />
            </Can>
            <TextField
              size="small"
              placeholder={tx('products.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ maxWidth: 360 }}
            />

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom
                  headLabel={tableHead}
                  rowCount={rows.length}
                  numSelected={selectedIds.length}
                  onSelectAllRows={(checked) => table.onSelectAllRows(checked, rows.map((row) => row.id))}
                />
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onClick={() => table.onSelectRow(row.id)}
                          disabled={!canWriteProducts}
                        />
                      </TableCell>
                      <TableCell>
                        <Can
                          page="products"
                          action="detail"
                          fallback={<Typography variant="subtitle2">{row.name}</Typography>}
                        >
                          <Link component={RouterLink} href={paths.products.details(row.id)} variant="subtitle2">
                            {row.name}
                          </Link>
                        </Can>
                      </TableCell>
                      <TableCell>{row.sku || '-'}</TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>{fCurrency(row.purchasePrice)}</TableCell>
                      <TableCell>{fCurrency(row.salePrice)}</TableCell>
                      <TableCell align="right">
                        {canWriteProducts ? (
                          <IconButton color="default" onClick={(event) => openActions(event, row.id)}>
                            <Iconify icon="eva:more-vertical-fill" />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableNoData notFound={!rows.length} title={tx('common.table.noData')} />
                </TableBody>
              </Table>
            </Scrollbar>

            <TablePaginationCustom
              count={total}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 25]}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Stack>
        </Card>
      )}

      <CustomPopover open={actionsPopover.open} onClose={handleCloseActions} sx={{ width: 180, p: 1 }}>
        <Can page="products" action="write">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            {tx('common.actions.edit')}
          </MenuItem>
        </Can>
        <Can page="products" action="write">
          <MenuItem onClick={handleAskDelete} sx={{ color: 'error.main' }} disabled={deletingCurrent}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            {tx('common.actions.delete')}
          </MenuItem>
        </Can>
      </CustomPopover>

      <Can page="products" action="write">
        <ProductUpsertDialog
          open={upsertOpen}
          mode={upsertMode}
          loading={upsertLoading}
          initialValues={
            upsertMode === 'edit' && editingProduct
              ? {
                  name: editingProduct.name,
                  sku: editingProduct.sku ?? '',
                  purchasePrice: editingProduct.purchasePrice,
                  salePrice: editingProduct.salePrice,
                  stock: String(editingProduct.stock),
                }
              : undefined
          }
          onClose={handleCloseUpsert}
          onSubmit={handleSubmitUpsert}
        />
      </Can>

      <Can page="products" action="write">
        <ConfirmDialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          title={tx('products.dialogs.delete.title')}
          content={tx('products.dialogs.delete.description')}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deletingCurrent}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>

      <Can page="products" action="write">
        <ConfirmDialog
          open={bulkDeleteOpen}
          onClose={handleCloseBulkDelete}
          title={tx('products.dialogs.delete.bulkTitle')}
          content={tx('products.dialogs.delete.bulkDescription', { count: selectedIds.length })}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleBulkDelete} disabled={deletingBulk}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>
    </>
  );
}
