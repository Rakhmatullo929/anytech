import { useMemo, useState, useCallback } from 'react';
// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
// utils
import { fCurrency } from 'src/utils/format-number';
// mock
import { MOCK_CATALOG, MOCK_CLIENTS, type MockCatalogProduct } from 'src/_mock/pos-app';
// components
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
// routes
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

type CartLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export default function PosView() {
  const settings = useSettingsContext();

  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientId, setClientId] = useState<string>('guest');
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'debt'>('cash');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_CATALOG;
    return MOCK_CATALOG.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [query]);

  const addProduct = useCallback((p: MockCatalogProduct) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.productId === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.salePrice }];
    });
  }, []);

  const setQty = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l));
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const subtotal = cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const completeSale = useCallback(() => {
    // Mock only — hook API here later
    setCart([]);
    setClientId('guest');
    setPaymentType('cash');
  }, []);

  return (
    <>
      <CustomBreadcrumbs
        heading="POS"
        links={[{ name: 'POS', href: paths.pos }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
        <Card sx={{ flex: 1, p: 2, minHeight: 480 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Товары
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск по названию или SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Scrollbar sx={{ maxHeight: 420 }}>
            <Stack spacing={0.5}>
              {filtered.map((p) => (
                <ListItemButton
                  key={p.id}
                  onClick={() => addProduct(p)}
                  sx={{
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.sku} · остаток {p.stock}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2">{fCurrency(p.salePrice)}</Typography>
                </ListItemButton>
              ))}
            </Stack>
          </Scrollbar>
        </Card>

        <Card
          sx={{
            width: { xs: 1, md: 380 },
            p: 2,
            position: { md: 'sticky' },
            top: settings.themeLayout === 'horizontal' ? 88 : 24,
            alignSelf: 'flex-start',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Корзина
          </Typography>

          {cart.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Добавьте товар из списка слева.
            </Typography>
          ) : (
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {cart.map((line) => (
                <Stack key={line.productId} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {line.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fCurrency(line.unitPrice)} × {line.quantity}
                    </Typography>
                  </Box>
                  <TextField
                    type="number"
                    size="small"
                    value={line.quantity}
                    onChange={(e) => setQty(line.productId, Number(e.target.value))}
                    inputProps={{ min: 1, style: { width: 56 } }}
                  />
                  <IconButton color="error" onClick={() => removeLine(line.productId)}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Клиент"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <MenuItem value="guest">Guest</MenuItem>
              {MOCK_CLIENTS.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Оплата"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'cash' | 'card' | 'debt')}
            >
              <MenuItem value="cash">Наличные</MenuItem>
              <MenuItem value="card">Карта</MenuItem>
              <MenuItem value="debt">В долг</MenuItem>
            </TextField>

            <Typography variant="h6">Итого: {fCurrency(subtotal)}</Typography>

            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={!cart.length}
              onClick={completeSale}
            >
              Завершить продажу
            </Button>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
