import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
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
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
// utils
import { useDebounce } from 'src/hooks/use-debounce';
import { useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';
import { fCurrency, fNumber } from 'src/utils/format-number';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
// components
import Iconify from 'src/components/iconify';
import MobileListFab from 'src/components/mobile-fab/mobile-list-fab';
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
import { FilterDrawer, FilterFieldMultiSelect, FilterFieldRange } from 'src/components/filter-drawer';
import {
  fetchProductDetail,
  useCategoriesListQuery,
  useBulkCreateProductsMutation,
  useBulkDeleteProductsMutation,
  useCreateProductMutation,
  useCreateProductPurchaseMutation,
  useDeleteProductMutation,
  useExportProductsMutation,
  useProductsListQuery,
  useUpdateProductMutation,
  useProductsUrlState,
  type BulkCreateProductsResult,
  type ProductImageFormValue,
  type ProductListItem,
} from 'src/sections/app/products/api';
import { ProductBulkImportDialog, ProductUpsertDialog } from 'src/sections/app/products/components';
import { ProductsListSkeleton } from 'src/sections/app/products/skeleton';

// ----------------------------------------------------------------------

type HeadCell = {
  id: string;
  label: string;
  sortKey?: string;
  sx?: object;
};

type EditingProductState = {
  product: ProductListItem;
  existingImages: ProductImageFormValue[];
};

export default function ProductsView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const createMutation = useCreateProductMutation();
  const createPurchaseMutation = useCreateProductPurchaseMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const bulkDeleteMutation = useBulkDeleteProductsMutation();
  const bulkImportMutation = useBulkCreateProductsMutation();
  const exportMutation = useExportProductsMutation();
  const { data: categoriesData } = useCategoriesListQuery();
  const categories = useMemo(() => categoriesData?.results ?? [], [categoriesData?.results]);

  // ── URL state ──────────────────────────────────────────────────────────
  const {
    page: pageParam,
    rowsPerPage,
    search: searchValue,
    ordering,
    categoryIds,
    minQuantity,
    maxQuantity,
    activeFiltersCount,
    setSearch,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  } = useProductsUrlState();

  const debouncedSearch = useDebounce(searchValue.trim(), 400);
  const debouncedMinQty = useDebounce(minQuantity, 400);
  const debouncedMaxQty = useDebounce(maxQuantity, 400);

  // ── Sorting ────────────────────────────────────────────────────────────
  const tableHead: HeadCell[] = useMemo(
    () => [
      { id: 'name', label: tx('common.table.name'), sortKey: 'name' },
      { id: 'sku', label: tx('common.table.sku'), sortKey: 'sku', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'category', label: tx('common.table.category'), sortKey: 'category__name', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'totalQuantity', label: tx('common.table.qty'), sortKey: 'total_quantity' },
      { id: 'salePrice', label: tx('common.table.salePrice'), sortKey: 'sale_price', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: 'totalPurchaseAmount', label: tx('common.table.purchase'), sortKey: 'total_purchase_amount', sx: { display: { xs: 'none', sm: 'table-cell' } } },
      { id: '', label: '' },
    ],
    [tx]
  );

  const { tableOrderBy, tableOrder } = useMemo(() => {
    const isDesc = ordering.startsWith('-');
    const field = isDesc ? ordering.slice(1) : ordering;
    const col = tableHead.find((h) => h.sortKey === field);
    return {
      tableOrderBy: col?.id ?? '',
      tableOrder: isDesc ? ('desc' as const) : ('asc' as const),
    };
  }, [ordering, tableHead]);

  const handleSort = useCallback(
    (columnId: string) => {
      const col = tableHead.find((h) => h.id === columnId);
      if (!col?.sortKey) return;
      const isCurrentAsc = tableOrderBy === columnId && tableOrder === 'asc';
      setOrdering(isCurrentAsc ? `-${col.sortKey}` : col.sortKey);
    },
    [tableHead, tableOrderBy, tableOrder, setOrdering]
  );

  // ── Table (selection) ──────────────────────────────────────────────────
  const table = useTable({
    defaultCurrentPage: Math.max(0, pageParam - 1),
    defaultRowsPerPage: rowsPerPage,
  });
  const { setPage, setRowsPerPage } = table;
  const page = Math.max(0, pageParam - 1);

  // ── Data ───────────────────────────────────────────────────────────────
  const { data, isPending, isFetching } = useProductsListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
    categoryIds: categoryIds.length ? categoryIds : undefined,
    minQuantity: debouncedMinQty || undefined,
    maxQuantity: debouncedMaxQty || undefined,
  });
  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;

  // ── Dialog states ──────────────────────────────────────────────────────
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<EditingProductState | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState<ProductListItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('1');
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<BulkCreateProductsResult | null>(null);
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

  // ── Action handlers ────────────────────────────────────────────────────
  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) setSelectedProductId(null);
  };

  const openActions = (event: MouseEvent<HTMLElement>, productId: string) => {
    setSelectedProductId(productId);
    actionsPopover.onOpen(event);
  };

  const handleEdit = async () => {
    if (!selectedProductId) return;
    const product = rows.find((row) => row.id === selectedProductId);
    if (!product) { closeActions(); return; }
    try {
      const detail = await fetchProductDetail(product.id);
      setUpsertMode('edit');
      const existingImages: ProductImageFormValue[] = detail.images.map((item) => ({
        id: item.id,
        preview: item.image,
        name: item.image.split('/').pop() || 'image',
        size: 0,
        type: 'image/*',
      }));
      setEditingProduct({ product, existingImages });
      setUpsertOpen(true);
      closeActions(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAskDelete = () => { closeActions(false); setDeleteOpen(true); };
  const handleCloseDelete = () => { setDeleteOpen(false); setSelectedProductId(null); };
  const handleOpenBulkDelete = () => setBulkDeleteOpen(true);
  const handleCloseBulkDelete = () => setBulkDeleteOpen(false);

  const handleOpenCreate = () => {
    setUpsertMode('create');
    setEditingProduct(null);
    setUpsertOpen(true);
  };

  const handleOpenPurchaseCreate = (product: ProductListItem) => {
    setPurchaseProduct(product);
    setPurchaseQuantity('1');
    setPurchaseUnitPrice('');
    setPurchaseOpen(true);
  };

  const handleCreatePurchase = async () => {
    if (!purchaseProduct) return;
    const quantity = Number(purchaseQuantity);
    const unitPrice = purchaseUnitPrice.trim();
    if (!quantity || quantity <= 0 || !unitPrice) return;
    try {
      await createPurchaseMutation.mutateAsync({ product: purchaseProduct.id, quantity, unitPrice });
      enqueueSnackbar(tx('products.toasts.created'), { variant: 'success' });
      setPurchaseOpen(false);
      setPurchaseProduct(null);
    } catch (error) {
      console.error(error);
    }
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
      enqueueSnackbar(tx('products.toasts.bulkDeleted', { count: selectedIds.length }), { variant: 'success' });
      table.onUpdatePageDeleteRows({ totalRows: total, totalRowsInPage: rows.length, totalRowsFiltered: total });
      table.setSelected([]);
      handleCloseBulkDelete();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenBulkImport = () => { setBulkImportResult(null); setBulkImportOpen(true); };
  const handleCloseBulkImport = () => { setBulkImportOpen(false); setBulkImportResult(null); };

  const handleBulkImport = async (file: File) => {
    try {
      const result = await bulkImportMutation.mutateAsync(file);
      setBulkImportResult(result);
      if (result.created > 0) {
        enqueueSnackbar(tx('products.bulkImport.toastSuccess', { count: result.created }), { variant: 'success' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        search: debouncedSearch || undefined,
        ordering,
        categoryIds: categoryIds.length ? categoryIds : undefined,
        minQuantity: debouncedMinQty || undefined,
        maxQuantity: debouncedMaxQty || undefined,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitUpsert = async (values: {
    name: string;
    sku: string;
    category: string;
    salePrice: string;
    images: ProductImageFormValue[];
  }) => {
    const normalizedName = values.name.trim();
    const normalizedSku = values.sku.trim();
    if (!normalizedName) {
      enqueueSnackbar(tx('products.toasts.requiredFields'), { variant: 'warning' });
      return;
    }
    try {
      if (upsertMode === 'create') {
        await createMutation.mutateAsync({
          name: normalizedName,
          sku: normalizedSku || undefined,
          category: values.category || undefined,
          salePrice: values.salePrice || '0',
          images: values.images.filter((item): item is File => item instanceof File),
        });
        enqueueSnackbar(tx('products.toasts.created'), { variant: 'success' });
      } else if (editingProduct) {
        const keepImageIds = values.images
          .filter((item): item is Extract<ProductImageFormValue, { id: string }> =>
            typeof item === 'object' && item !== null && 'id' in item
          )
          .map((item) => item.id);
        await updateMutation.mutateAsync({
          id: editingProduct.product.id,
          name: normalizedName,
          sku: normalizedSku || undefined,
          category: values.category || undefined,
          salePrice: values.salePrice || '0',
          images: values.images.filter((item): item is File => item instanceof File),
          keepImageIds,
        });
        enqueueSnackbar(tx('products.toasts.updated'), { variant: 'success' });
      }
      handleCloseUpsert();
      setPage(0);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Derived flags ──────────────────────────────────────────────────────
  const upsertLoading = createMutation.isPending || updateMutation.isPending;
  const purchaseLoading = createPurchaseMutation.isPending;
  const deletingCurrent =
    deleteMutation.isPending && selectedProductId !== null && deleteMutation.variables === selectedProductId;
  const deletingBulk = bulkDeleteMutation.isPending;
  const canWriteProducts = canWritePage('products');

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.products')}
        links={[{ name: tx('common.navigation.products'), href: paths.products.root }]}
        action={
          <Can page="products" action="write">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={handleOpenBulkImport}
              >
                {tx('products.bulkImport.button')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleOpenCreate}
              >
                {tx('products.addButton')}
              </Button>
            </Stack>
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

            {/* Toolbar: search (left) + filters + export (right) */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <TextField
                size="small"
                placeholder={tx('products.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: { xs: 1, sm: 0 }, width: { sm: 280 }, minWidth: 0, flexShrink: 0 }}
              />

              <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />

              <Stack direction="row" spacing={1}>
                <FilterDrawer
                  filtersCount={activeFiltersCount}
                  title={tx('common.actions.filters')}
                  resetLabel={tx('common.actions.reset')}
                  onReset={resetFilters}
                >
                  <FilterFieldMultiSelect
                    label={tx('products.filters.category')}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    value={categoryIds}
                    onChange={(ids) => setFilters({ categories: ids.join(',') })}
                  />
                  <FilterFieldRange
                    label={tx('products.filters.quantityRange')}
                    minLabel={tx('products.filters.minQty')}
                    maxLabel={tx('products.filters.maxQty')}
                    minValue={minQuantity}
                    maxValue={maxQuantity}
                    onMinChange={(v) => setFilters({ minQuantity: v })}
                    onMaxChange={(v) => setFilters({ maxQuantity: v })}
                  />
                </FilterDrawer>

                <Button
                  variant="outlined"
                  startIcon={
                    exportMutation.isPending ? (
                      <Iconify icon="svg-spinners:ring-resize" />
                    ) : (
                      <Iconify icon="eva:download-fill" />
                    )
                  }
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  aria-label={tx('common.actions.export')}
                  sx={{
                    px: { xs: 1, sm: 2 },
                    '& .MuiButton-startIcon': {
                      mr: { xs: 0, sm: 1 },
                      ml: { xs: 0, sm: -0.5 },
                    },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {tx('common.actions.export')}
                  </Box>
                </Button>
              </Stack>
            </Stack>

            <Scrollbar>
              <Table size="small">
                <TableHeadCustom
                  order={tableOrder}
                  orderBy={tableOrderBy}
                  onSort={handleSort}
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
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={row.image ?? undefined} alt={row.name}>
                            {row.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Can
                            page="products"
                            action="detail"
                            fallback={
                              <ListItemText
                                primary={row.name}
                                primaryTypographyProps={{ variant: 'subtitle2' }}
                              />
                            }
                          >
                            <ListItemText
                              primary={
                                <Link
                                  component={RouterLink}
                                  href={paths.products.details(row.id)}
                                  variant="subtitle2"
                                >
                                  {row.name}
                                </Link>
                              }
                            />
                          </Can>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.sku || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.category?.name || '-'}</TableCell>
                      <TableCell>{fNumber(row.totalQuantity)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{fCurrency(row.salePrice)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{fCurrency(row.totalPurchaseAmount)}</TableCell>
                      <TableCell align="right">
                        {canWriteProducts ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton color="primary" onClick={() => handleOpenPurchaseCreate(row)}>
                              <Iconify icon="mingcute:add-line" />
                            </IconButton>
                            <IconButton color="default" onClick={(event) => openActions(event, row.id)}>
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </Stack>
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

      <CustomPopover open={actionsPopover.open} onClose={() => closeActions()} sx={{ width: 180, p: 1 }}>
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
        <MobileListFab
          onClick={handleOpenCreate}
          secondaryAction={{
            icon: 'eva:cloud-upload-fill',
            onClick: handleOpenBulkImport,
            ariaLabel: tx('products.bulkImport.button'),
          }}
        />
      </Can>

      <Can page="products" action="write">
        <ProductUpsertDialog
          open={upsertOpen}
          mode={upsertMode}
          loading={upsertLoading}
          initialValues={
            upsertMode === 'edit' && editingProduct
              ? {
                  name: editingProduct.product.name,
                  sku: editingProduct.product.sku ?? '',
                  category: editingProduct.product.category?.id ?? '',
                  salePrice: editingProduct.product.salePrice ?? '0',
                  images: editingProduct.existingImages,
                }
              : undefined
          }
          categories={categories.map((item) => ({ id: item.id, name: item.name }))}
          onClose={handleCloseUpsert}
          onSubmit={handleSubmitUpsert}
        />
      </Can>

      <Can page="products" action="write">
        <Dialog open={purchaseOpen} onClose={() => setPurchaseOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>{tx('common.table.purchase')}</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2}>
              <TextField
                label={tx('common.table.product')}
                value={purchaseProduct?.name ?? ''}
                disabled
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={tx('common.table.qty')}
                type="number"
                value={purchaseQuantity}
                onChange={(e) => setPurchaseQuantity(e.target.value)}
              />
              <TextField
                label={tx('common.table.price')}
                value={purchaseUnitPrice}
                onChange={(e) => setPurchaseUnitPrice(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPurchaseOpen(false)}>{tx('common.actions.cancel')}</Button>
            <Button variant="contained" onClick={handleCreatePurchase} disabled={purchaseLoading}>
              {tx('common.actions.save')}
            </Button>
          </DialogActions>
        </Dialog>
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

      <Can page="products" action="write">
        <ProductBulkImportDialog
          open={bulkImportOpen}
          loading={bulkImportMutation.isPending}
          result={bulkImportResult}
          onClose={handleCloseBulkImport}
          onImport={handleBulkImport}
        />
      </Can>
    </>
  );
}
