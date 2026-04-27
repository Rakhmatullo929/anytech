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
// utils
import { fDateTime } from 'src/utils/format-time';
import { useDebounce } from 'src/hooks/use-debounce';
import { useUrlListState, useSyncTableWithUrlListState } from 'src/hooks/use-url-query-state';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';
// routes
import { paths } from 'src/routes/paths';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSnackbar } from 'src/components/snackbar';
import {
  TableSelectedAction,
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import {
  useCategoriesListQuery,
  useBulkDeleteCategoriesMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
  type CategoryListItem,
} from 'src/sections/app/categories/api';
import { CategoryUpsertDialog } from 'src/sections/app/categories/components';
import { CategoriesListSkeleton } from 'src/sections/app/categories/skeleton';

export default function CategoriesView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const actionsPopover = usePopover();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const bulkDeleteMutation = useBulkDeleteCategoriesMutation();

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('common.table.category') },
      { id: 'created', label: tx('common.table.created') },
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

  const { data, isPending, isFetching } = useCategoriesListQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch || undefined,
    ordering,
  });

  const rows = useMemo(() => data?.results ?? [], [data?.results]);
  const total = data?.count ?? 0;
  const showInitialLoader = isPending && !data;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
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
      setSelectedCategoryId(null);
    }
  };

  const openActions = (event: MouseEvent<HTMLElement>, categoryId: string) => {
    setSelectedCategoryId(categoryId);
    actionsPopover.onOpen(event);
  };

  const handleEdit = () => {
    if (!selectedCategoryId) return;
    const category = rows.find((row) => row.id === selectedCategoryId);
    if (!category) {
      closeActions();
      return;
    }
    setEditingCategory(category);
    setUpsertMode('edit');
    setUpsertOpen(true);
    closeActions(false);
  };

  const handleAskDelete = () => {
    closeActions(false);
    setDeleteOpen(true);
  };

  const handleOpenCreate = () => {
    setUpsertMode('create');
    setEditingCategory(null);
    setUpsertOpen(true);
  };

  const handleOpenBulkDelete = () => {
    setBulkDeleteOpen(true);
  };

  const handleCloseUpsert = () => {
    setUpsertOpen(false);
    setEditingCategory(null);
    setSelectedCategoryId(null);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedCategoryId(null);
  };

  const handleCloseBulkDelete = () => {
    setBulkDeleteOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedCategoryId) return;
    try {
      await deleteMutation.mutateAsync(selectedCategoryId);
      enqueueSnackbar(tx('categories.toasts.deleted'), { variant: 'success' });
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
      enqueueSnackbar(tx('categories.toasts.bulkDeleted', { count: selectedIds.length }), {
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

  const handleSubmitUpsert = async (values: { name: string }) => {
    const normalizedName = values.name.trim();
    if (!normalizedName) {
      return;
    }

    try {
      if (upsertMode === 'create') {
        await createMutation.mutateAsync({ name: normalizedName });
        enqueueSnackbar(tx('categories.toasts.created'), { variant: 'success' });
      } else if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          name: normalizedName,
        });
        enqueueSnackbar(tx('categories.toasts.updated'), { variant: 'success' });
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
    selectedCategoryId !== null &&
    deleteMutation.variables === selectedCategoryId;
  const deletingBulk = bulkDeleteMutation.isPending;
  const canWriteCategories = canWritePage('categories');

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.categories')}
        links={[{ name: tx('common.navigation.categories'), href: paths.categories.root }]}
        action={
          <Can page="categories" action="write">
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
              {tx('categories.addButton')}
            </Button>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {showInitialLoader ? (
        <CategoriesListSkeleton headLabel={tableHead} />
      ) : (
        <Card>
          {isFetching && data ? (
            <LinearProgress sx={{ borderRadius: 1 }} color="inherit" />
          ) : (
            <Box sx={{ height: 4 }} />
          )}

          <Stack spacing={2} sx={{ p: 2 }}>
            <Can page="categories" action="write">
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
              placeholder={tx('categories.searchPlaceholder')}
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
                          disabled={!canWriteCategories}
                        />
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{fDateTime(row.createdAt)}</TableCell>
                      <TableCell align="right">
                        {canWriteCategories ? (
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

      <CustomPopover open={actionsPopover.open} onClose={() => closeActions()} sx={{ width: 180, p: 1 }}>
        <Can page="categories" action="write">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            {tx('common.actions.edit')}
          </MenuItem>
        </Can>
        <Can page="categories" action="write">
          <MenuItem onClick={handleAskDelete} sx={{ color: 'error.main' }} disabled={deletingCurrent}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            {tx('common.actions.delete')}
          </MenuItem>
        </Can>
      </CustomPopover>

      <Can page="categories" action="write">
        <CategoryUpsertDialog
          open={upsertOpen}
          mode={upsertMode}
          loading={upsertLoading}
          initialValues={upsertMode === 'edit' && editingCategory ? { name: editingCategory.name } : undefined}
          onClose={handleCloseUpsert}
          onSubmit={handleSubmitUpsert}
        />
      </Can>

      <Can page="categories" action="write">
        <ConfirmDialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          title={tx('categories.dialogs.delete.title')}
          content={tx('categories.dialogs.delete.description')}
          cancelText={tx('common.actions.cancel')}
          action={
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deletingCurrent}>
              {tx('common.actions.delete')}
            </Button>
          }
        />
      </Can>

      <Can page="categories" action="write">
        <ConfirmDialog
          open={bulkDeleteOpen}
          onClose={handleCloseBulkDelete}
          title={tx('categories.dialogs.delete.bulkTitle')}
          content={tx('categories.dialogs.delete.bulkDescription', { count: selectedIds.length })}
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
