import { useState, useMemo, useEffect } from 'react';
// locales
import { useLocales } from 'src/locales';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
// utils
import { fCurrency } from 'src/utils/format-number';
// mock
import { MOCK_CATALOG, type MockCatalogProduct } from 'src/_mock/pos-app';
// routes
import { paths } from 'src/routes/paths';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

// ----------------------------------------------------------------------

export default function ProductsView() {
  const { tx } = useLocales();

  const tableHead = useMemo(
    () => [
      { id: 'name', label: tx('shared.table.name') },
      { id: 'sku', label: tx('shared.table.sku') },
      { id: 'stock', label: tx('shared.table.stock') },
      { id: 'purchase', label: tx('shared.table.purchase') },
      { id: 'sale', label: tx('shared.table.sale_price') },
      { id: '', label: '' },
    ],
    [tx]
  );

  const [rows, setRows] = useState<MockCatalogProduct[]>(() => [...MOCK_CATALOG]);
  const [query, setQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<MockCatalogProduct | null>(null);
  const [stockRow, setStockRow] = useState<MockCatalogProduct | null>(null);

  const table = useTable({ defaultRowsPerPage: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q));
  }, [rows, query]);

  const paginated = useMemo(
    () =>
      filtered.slice(
        table.page * table.rowsPerPage,
        table.page * table.rowsPerPage + table.rowsPerPage
      ),
    [filtered, table.page, table.rowsPerPage]
  );

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.products')}
        links={[{ name: tx('layout.nav.products'), href: paths.products }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setCreateOpen(true)}
          >
            {tx('pages.products.create_button')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder={tx('pages.products.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ maxWidth: 360 }}
          />

          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={tableHead} />
              <TableBody>
                {paginated.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.sku}</TableCell>
                    <TableCell>{row.stock}</TableCell>
                    <TableCell>{fCurrency(row.purchasePrice)}</TableCell>
                    <TableCell>{fCurrency(row.salePrice)}</TableCell>
                    <TableCell align="right">
                      <IconButton color="default" onClick={() => setEditRow(row)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton color="default" onClick={() => setStockRow(row)}>
                        <Iconify icon="solar:box-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                <TableNoData notFound={!paginated.length} />
              </TableBody>
            </Table>
          </Scrollbar>

          <TablePaginationCustom
            count={filtered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Stack>
      </Card>

      <ProductCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(p) => {
          setRows((r) => [...r, p]);
          setCreateOpen(false);
        }}
      />

      <ProductEditDialog
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={(p) => {
          setRows((r) => r.map((x) => (x.id === p.id ? p : x)));
          setEditRow(null);
        }}
      />

      <StockDialog
        row={stockRow}
        onClose={() => setStockRow(null)}
        onApply={(id, nextStock) => {
          setRows((r) => r.map((x) => (x.id === id ? { ...x, stock: nextStock } : x)));
          setStockRow(null);
        }}
      />
    </>
  );
}

function ProductCreateDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: MockCatalogProduct) => void;
}) {
  const { tx } = useLocales();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [purchase, setPurchase] = useState('0');
  const [sale, setSale] = useState('0');
  const [stock, setStock] = useState('0');

  useEffect(() => {
    if (open) {
      setName('');
      setSku('');
      setPurchase('0');
      setSale('0');
      setStock('0');
    }
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    const pp = Number(purchase);
    const sp = Number(sale);
    const st = Number(stock);
    if (pp < 0 || sp < 0 || st < 0) return;
    onSave({
      id: `p-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now()}`,
      stock: st,
      purchasePrice: pp,
      salePrice: sp,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{tx('pages.products.dialogs.create.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={tx('shared.table.name')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField label={tx('shared.table.sku')} value={sku} onChange={(e) => setSku(e.target.value)} />
          <TextField
            label={tx('pages.products.dialogs.create.purchase_price')}
            type="number"
            value={purchase}
            onChange={(e) => setPurchase(e.target.value)}
          />
          <TextField
            label={tx('pages.products.dialogs.create.sale_price')}
            type="number"
            value={sale}
            onChange={(e) => setSale(e.target.value)}
          />
          <TextField
            label={tx('pages.products.dialogs.create.initial_stock')}
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
        <Button variant="contained" onClick={submit}>
          {tx('shared.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ProductEditDialog({
  row,
  onClose,
  onSave,
}: {
  row: MockCatalogProduct | null;
  onClose: () => void;
  onSave: (p: MockCatalogProduct) => void;
}) {
  const { tx } = useLocales();
  const open = !!row;
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [purchase, setPurchase] = useState('0');
  const [sale, setSale] = useState('0');

  useEffect(() => {
    if (row) {
      setName(row.name);
      setSku(row.sku);
      setPurchase(String(row.purchasePrice));
      setSale(String(row.salePrice));
    }
  }, [row]);

  const submit = () => {
    if (!row || !name.trim()) return;
    const pp = Number(purchase);
    const sp = Number(sale);
    if (pp < 0 || sp < 0) return;
    onSave({
      ...row,
      name: name.trim(),
      sku: sku.trim(),
      purchasePrice: pp,
      salePrice: sp,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{tx('pages.products.dialogs.edit.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={tx('shared.table.name')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField label={tx('shared.table.sku')} value={sku} onChange={(e) => setSku(e.target.value)} />
          <TextField
            label={tx('pages.products.dialogs.create.purchase_price')}
            type="number"
            value={purchase}
            onChange={(e) => setPurchase(e.target.value)}
          />
          <TextField
            label={tx('pages.products.dialogs.create.sale_price')}
            type="number"
            value={sale}
            onChange={(e) => setSale(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary">
            {tx('pages.products.dialogs.edit.stock_hint')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
        <Button variant="contained" onClick={submit}>
          {tx('shared.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StockDialog({
  row,
  onClose,
  onApply,
}: {
  row: MockCatalogProduct | null;
  onClose: () => void;
  onApply: (id: string, nextStock: number) => void;
}) {
  const { tx } = useLocales();
  const open = !!row;
  const [mode, setMode] = useState<'set' | 'increment'>('set');
  const [value, setValue] = useState('0');

  useEffect(() => {
    if (row) {
      setMode('set');
      setValue(String(row.stock));
    }
  }, [row]);

  const apply = () => {
    if (!row) return;
    const n = Number(value);
    if (Number.isNaN(n)) return;
    let next: number;
    if (mode === 'set') {
      next = n;
    } else {
      next = row.stock + n;
    }
    if (next < 0) return;
    onApply(row.id, next);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{tx('pages.products.dialogs.stock.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label={tx('pages.products.dialogs.stock.mode')}
            value={mode}
            onChange={(e) => setMode(e.target.value as 'set' | 'increment')}
          >
            <MenuItem value="set">{tx('pages.products.dialogs.stock.mode_set')}</MenuItem>
            <MenuItem value="increment">{tx('pages.products.dialogs.stock.mode_increment')}</MenuItem>
          </TextField>
          <TextField
            label={
              mode === 'set'
                ? tx('pages.products.dialogs.stock.new_stock')
                : tx('pages.products.dialogs.stock.delta')
            }
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tx('shared.actions.cancel')}</Button>
        <Button variant="contained" onClick={apply}>
          {tx('shared.actions.apply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
