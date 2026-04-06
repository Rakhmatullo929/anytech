import { useMemo, useState, useEffect } from 'react';
// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
// utils
import { fDateTime } from 'src/utils/format-time';
// mock
import { MOCK_CLIENTS, type MockClient } from 'src/_mock/pos-app';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
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

const TABLE_HEAD = [
  { id: 'name', label: 'Имя' },
  { id: 'phone', label: 'Телефон' },
  { id: 'created', label: 'Создан' },
  { id: '', label: '' },
];

export default function ClientsView() {
  const [rows, setRows] = useState<MockClient[]>(() => [...MOCK_CLIENTS]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const table = useTable({ defaultRowsPerPage: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)
    );
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
        heading="Клиенты"
        links={[{ name: 'Клиенты', href: paths.clients.root }]}
        action={
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setOpen(true)}>
            Добавить клиента
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack spacing={2} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Поиск по имени или телефону…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ maxWidth: 360 }}
          />

          <Scrollbar>
            <Table size="small">
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {paginated.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{fDateTime(row.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton component={RouterLink} href={paths.clients.details(row.id)} color="default">
                        <Iconify icon="solar:eye-bold" />
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

      <ClientCreateDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={(c) => {
          setRows((r) => [...r, c]);
          setOpen(false);
        }}
      />
    </>
  );
}

function ClientCreateDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (c: MockClient) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
    }
  }, [open]);

  const submit = () => {
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p || n.length > 255 || p.length > 20) return;
    onSave({
      id: `c-${Date.now()}`,
      name: n,
      phone: p,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новый клиент</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Имя" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Телефон" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
