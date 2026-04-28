import { useMemo, useState, type MouseEvent } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
// utils
import { fDateTime } from 'src/utils/format-time';
import { fCurrency, fNumber } from 'src/utils/format-number';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
import { useDebounce } from 'src/hooks/use-debounce';
import { stringParam, useUrlListState, useUrlQueryState } from 'src/hooks/use-url-query-state';
// components
import Can from 'src/auth/components/can';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import EmptyContent from 'src/components/empty-content';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import {
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
  TableSelectedAction,
  useTable,
} from 'src/components/table';
import EntityDetailHeader from 'src/sections/app/components/entity-detail-header';
import {
  useBulkDeleteProductPurchasesMutation,
  useCreateProductPurchaseMutation,
  useDeleteProductPurchaseMutation,
  useProductDetailQuery,
  useProductPurchasesListQuery,
  useUpdateProductPurchaseMutation,
  type ProductPurchaseListItem,
} from 'src/sections/app/products/api';
import { ProductDetailsSkeleton } from 'src/sections/app/products/skeleton';

// ----------------------------------------------------------------------

const PLACEHOLDER_BG = 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)';
type ProductDetailsTab = 'info' | 'table';

export default function ProductDetailsView() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const { id = '' } = useParams();
  const { data: product, isPending } = useProductDetailQuery(id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { values, setValues } = useUrlQueryState({ tab: stringParam('info') });
  const actionsPopover = usePopover();
  const table = useTable();
  const {
    page: pageParam,
    rowsPerPage,
    search: searchValue,
    ordering,
    setSearch,
    handlePageChange,
    handleRowsPerPageChange,
  } = useUrlListState({
    pageKey: 'purchases_page',
    pageSizeKey: 'purchases_page_size',
    searchKey: 'purchases_search',
    orderingKey: 'purchases_ordering',
    defaultPage: 1,
    defaultPageSize: 10,
    defaultOrdering: '-created_at',
  });
  const debouncedSearch = useDebounce(searchValue.trim(), 400);
  const purchasesPage = Math.max(0, pageParam - 1);
  const purchasesQuery = useProductPurchasesListQuery({
    page: purchasesPage + 1,
    pageSize: rowsPerPage,
    productId: id,
    search: debouncedSearch || undefined,
    ordering,
  });
  const createPurchaseMutation = useCreateProductPurchaseMutation();
  const updatePurchaseMutation = useUpdateProductPurchaseMutation();
  const deletePurchaseMutation = useDeleteProductPurchaseMutation();
  const bulkDeletePurchaseMutation = useBulkDeleteProductPurchasesMutation();
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<'create' | 'edit'>('create');
  const [editingPurchase, setEditingPurchase] = useState<ProductPurchaseListItem | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitPriceInput, setUnitPriceInput] = useState('');
  const [currencyInput, setCurrencyInput] = useState('USD');

  const images = useMemo(() => {
    if (!product) return [];
    return product.images.map((item) => item.image).filter(Boolean);
  }, [product]);

  const hasImages = images.length > 0;
  const clampedIndex = Math.min(activeImageIndex, Math.max(images.length - 1, 0));
  const currentImage = hasImages ? images[clampedIndex] : null;
  const activeTab: ProductDetailsTab = values.tab === 'table' ? 'table' : 'info';
  const purchaseRows = purchasesQuery.data?.results ?? [];
  const purchasesTotal = purchasesQuery.data?.count ?? 0;
  const tableHead = useMemo(
    () => [
      { id: 'qty', label: tx('common.table.qty') },
      { id: 'price', label: tx('common.table.price') },
      { id: 'amount', label: tx('common.table.amount') },
      { id: 'created', label: tx('common.table.created') },
      { id: '', label: '' },
    ],
    [tx]
  );

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

  const closeActions = (clearSelected = true) => {
    actionsPopover.onClose();
    if (clearSelected) setSelectedPurchaseId(null);
  };

  const openActions = (event: MouseEvent<HTMLElement>, purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    actionsPopover.onOpen(event);
  };

  const handleOpenCreate = () => {
    setUpsertMode('create');
    setEditingPurchase(null);
    setQuantityInput('1');
    setUnitPriceInput('');
    setCurrencyInput('USD');
    setUpsertOpen(true);
  };

  const handleOpenEdit = () => {
    if (!selectedPurchaseId) return;
    const target = purchaseRows.find((row) => row.id === selectedPurchaseId);
    if (!target) return;
    setUpsertMode('edit');
    setEditingPurchase(target);
    setQuantityInput(String(target.quantity));
    setUnitPriceInput(target.unitPrice);
    setCurrencyInput(target.currency);
    setUpsertOpen(true);
    closeActions(false);
  };

  const handleSavePurchase = async () => {
    const quantity = Number(quantityInput);
    const unitPrice = unitPriceInput.trim();
    const currency = currencyInput.trim().toUpperCase();
    if (!quantity || quantity <= 0 || !unitPrice) return;

    try {
      if (upsertMode === 'create') {
        await createPurchaseMutation.mutateAsync({
          product: product.id,
          quantity,
          unitPrice,
          currency,
        });
        enqueueSnackbar(tx('products.toasts.created'), { variant: 'success' });
      } else if (editingPurchase) {
        await updatePurchaseMutation.mutateAsync({
          id: editingPurchase.id,
          product: product.id,
          quantity,
          unitPrice,
          currency,
        });
        enqueueSnackbar(tx('products.toasts.updated'), { variant: 'success' });
      }
      setUpsertOpen(false);
      setEditingPurchase(null);
      setSelectedPurchaseId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePurchase = async () => {
    if (!selectedPurchaseId) return;
    try {
      await deletePurchaseMutation.mutateAsync(selectedPurchaseId);
      enqueueSnackbar(tx('products.toasts.deleted'), { variant: 'success' });
      setDeleteOpen(false);
      setSelectedPurchaseId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkDeletePurchases = async () => {
    if (!table.selected.length) return;
    try {
      await bulkDeletePurchaseMutation.mutateAsync(table.selected);
      enqueueSnackbar(tx('products.toasts.bulkDeleted', { count: table.selected.length }), {
        variant: 'success',
      });
      table.setSelected([]);
      setBulkDeleteOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const openImagePreview = (index?: number) => {
    if (typeof index === 'number') {
      setActiveImageIndex(index);
    }
    setImagePreviewOpen(true);
  };

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

        <Tabs value={activeTab} onChange={(_event, tab: ProductDetailsTab) => setValues({ tab })} sx={{ px: 0.5 }}>
          <Tab value="info" label={tx('products.tabs.info')} />
          <Tab value="table" label={tx('products.tabs.table')} />
        </Tabs>

        <Box>
          {activeTab === 'info' ? (
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
                      onClick={() => openImagePreview(clampedIndex)}
                      sx={{
                        width: '100%',
                        height: { xs: 260, md: 380 },
                        objectFit: 'contain',
                        bgcolor: 'common.white',
                        cursor: 'zoom-in',
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
                        onClick={() => openImagePreview(clampedIndex)}
                        sx={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          bgcolor: 'rgba(17,24,39,0.4)',
                          color: 'common.white',
                          '&:hover': { bgcolor: 'rgba(17,24,39,0.6)' },
                        }}
                      >
                        <Iconify icon="solar:magnifer-zoom-in-bold" />
                      </IconButton>
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
                        <Box component="img" src={item} alt={`${product.name}-${idx + 1}`} sx={{ width: 1, height: 1, objectFit: 'contain', bgcolor: 'common.white' }} />
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
          ) : (
            <Card sx={{ p: 3 }}>
              {purchasesQuery.isFetching && purchasesQuery.data ? (
                <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
              ) : (
                <Box sx={{ height: 4 }} />
              )}
              <Stack spacing={2} sx={{ p: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">{tx('products.tabs.table')}</Typography>
                  <Can page="products" action="write">
                    <Button variant="contained" size="small" onClick={handleOpenCreate} startIcon={<Iconify icon="mingcute:add-line" />}>
                      {tx('products.addButton')}
                    </Button>
                  </Can>
                </Stack>

                <Can page="products" action="write">
                  <TableSelectedAction
                    numSelected={table.selected.length}
                    rowCount={purchaseRows.length}
                    onSelectAllRows={(checked) => table.onSelectAllRows(checked, purchaseRows.map((row) => row.id))}
                    action={
                      <Button color="error" onClick={() => setBulkDeleteOpen(true)}>
                        {tx('common.actions.delete')}
                      </Button>
                    }
                  />
                </Can>

                <TextField
                  size="small"
                  placeholder={tx('products.searchPlaceholder')}
                  value={searchValue}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{ maxWidth: 320 }}
                />

                <Scrollbar>
                  <Table size="small">
                    <TableHeadCustom
                      headLabel={tableHead}
                      rowCount={purchaseRows.length}
                      numSelected={table.selected.length}
                      onSelectAllRows={(checked) => table.onSelectAllRows(checked, purchaseRows.map((row) => row.id))}
                    />
                    <TableBody>
                      {purchaseRows.map((row) => (
                        <TableRow key={row.id} hover selected={table.selected.includes(row.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox checked={table.selected.includes(row.id)} onClick={() => table.onSelectRow(row.id)} />
                          </TableCell>
                          <TableCell>{fNumber(row.quantity)}</TableCell>
                          <TableCell>{fCurrency(row.unitPrice)}</TableCell>
                          <TableCell>{fCurrency(String(Number(row.unitPrice) * row.quantity))}</TableCell>
                          <TableCell>{fDateTime(row.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Can page="products" action="write">
                              <IconButton onClick={(event) => openActions(event, row.id)}>
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
                            </Can>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableNoData notFound={!purchaseRows.length} title={tx('common.table.noData')} />
                    </TableBody>
                  </Table>
                </Scrollbar>

                <TablePaginationCustom
                  count={purchasesTotal}
                  page={purchasesPage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                />
              </Stack>
            </Card>
          )}
        </Box>
      </Stack>

      <CustomPopover open={actionsPopover.open} onClose={() => closeActions()} sx={{ width: 160, p: 1 }}>
        <MenuItem onClick={handleOpenEdit}>
          <Iconify icon="solar:pen-bold" />
          {tx('common.actions.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteOpen(true);
            closeActions(false);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {tx('common.actions.delete')}
        </MenuItem>
      </CustomPopover>

      <Dialog open={upsertOpen} onClose={() => setUpsertOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{upsertMode === 'create' ? tx('products.addButton') : tx('common.actions.edit')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField label={tx('common.table.qty')} type="number" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} />
            <TextField label={tx('common.table.price')} value={unitPriceInput} onChange={(e) => setUnitPriceInput(e.target.value)} />
            <TextField label="Currency" value={currencyInput} onChange={(e) => setCurrencyInput(e.target.value)} inputProps={{ maxLength: 3 }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpsertOpen(false)}>{tx('common.actions.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSavePurchase}
            disabled={createPurchaseMutation.isPending || updatePurchaseMutation.isPending}
          >
            {tx('common.actions.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: { bgcolor: 'rgba(15,23,42,0.92)', boxShadow: 'none' },
        }}
      >
        <DialogContent sx={{ p: 1.5 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: '60vh', md: '80vh' },
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
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : null}

            <IconButton
              onClick={() => setImagePreviewOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                bgcolor: 'rgba(255,255,255,0.16)',
                color: 'common.white',
              }}
            >
              <Iconify icon="mingcute:close-line" />
            </IconButton>

            {hasImages ? (
              <>
                <IconButton
                  onClick={() => setActiveImageIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1))}
                  sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white' }}
                >
                  <Iconify icon="eva:arrow-ios-back-fill" />
                </IconButton>
                <IconButton
                  onClick={() => setActiveImageIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1))}
                  sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white' }}
                >
                  <Iconify icon="eva:arrow-ios-forward-fill" />
                </IconButton>
              </>
            ) : null}
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={tx('products.dialogs.delete.title')}
        content={tx('products.dialogs.delete.description')}
        action={
          <Button color="error" variant="contained" onClick={handleDeletePurchase}>
            {tx('common.actions.delete')}
          </Button>
        }
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={tx('products.dialogs.delete.bulkTitle')}
        content={tx('products.dialogs.delete.bulkDescription', { count: table.selected.length })}
        action={
          <Button color="error" variant="contained" onClick={handleBulkDeletePurchases}>
            {tx('common.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
