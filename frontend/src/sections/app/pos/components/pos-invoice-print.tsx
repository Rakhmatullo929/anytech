import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLocales } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import type { SaleListItem, SalePaymentType } from '../api/types';

// ----------------------------------------------------------------------

export type InvoiceCartItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  sale: SaleListItem;
  items: InvoiceCartItem[];
  clientPhone?: string | null;
};

// ----------------------------------------------------------------------

export const INVOICE_PRINT_PORTAL_ID = 'pos-invoice-print-portal';

const PRINT_GLOBAL_STYLES = {
  '@page': {
    size: 'A4',
    margin: '12mm',
  },
  '@media print': {
    'body': {
      visibility: 'hidden',
    },
    [`#${INVOICE_PRINT_PORTAL_ID}`]: {
      display: 'block !important' as string,
      visibility: 'visible',
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
    },
    [`#${INVOICE_PRINT_PORTAL_ID} *`]: {
      visibility: 'visible',
    },
  },
} as const;

// ----------------------------------------------------------------------

const PAYMENT_LABEL: Record<SalePaymentType, string> = {
  cash: 'pos.invoice.paymentCash',
  card: 'pos.invoice.paymentCard',
  transfer: 'pos.invoice.paymentTransfer',
  debt: 'pos.invoice.paymentDebt',
};

// ----------------------------------------------------------------------

type Props = {
  data: InvoiceData;
};

export default function PosInvoicePrint({ data }: Props) {
  const { tx } = useLocales();
  const { sale, items, clientPhone } = data;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalAmount = parseFloat(sale.totalAmount) || subtotal;

  const saleShortId = sale.id.replace(/-/g, '').slice(0, 10).toUpperCase();

  const clientFullName = sale.clientName || '';
  const cashierName = sale.createdByName || '';
  const paymentKey = PAYMENT_LABEL[sale.paymentType] ?? null;

  return (
    <>
      <GlobalStyles styles={PRINT_GLOBAL_STYLES} />

      <Box
        sx={{
          width: '210mm',
          bgcolor: '#ffffff',
          color: '#111111',
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box',
          border: '1px solid #e0e0e0',
          '@media print': {
            border: 'none',
            width: '100%',
          },
        }}
      >
        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <Box
          sx={{
            borderBottom: '2px solid #111',
            px: '8mm',
            pt: '8mm',
            pb: '5mm',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '20pt',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#111',
              lineHeight: 1,
            }}
          >
            {tx('pos.invoice.heading')}
          </Typography>
        </Box>

        {/* ── INVOICE META ─────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            px: '8mm',
            pt: '5mm',
            pb: '4mm',
            borderBottom: '1px solid #ccc',
          }}
        >
          {/* Left column */}
          <Stack spacing={0.6}>
            <MetaRow label={tx('pos.invoice.number')} value={`#${saleShortId}`} />
            {cashierName && (
              <MetaRow label={tx('pos.invoice.cashier')} value={cashierName} />
            )}
            {paymentKey && (
              <MetaRow label={tx('pos.invoice.payment')} value={tx(paymentKey as any)} />
            )}
          </Stack>

          {/* Right column */}
          <Stack spacing={0.6} sx={{ alignItems: 'flex-end' }}>
            <MetaRow label={tx('pos.invoice.date')} value={fDate(sale.createdAt)} />
            <MetaRow label={tx('pos.invoice.time')} value={fDateTime(sale.createdAt, 'HH:mm')} />
          </Stack>
        </Box>

        {/* ── CUSTOMER ─────────────────────────────────────────────────── */}
        {(clientFullName || clientPhone) && (
          <Box
            sx={{
              px: '8mm',
              pt: '4mm',
              pb: '4mm',
              borderBottom: '1px solid #ccc',
            }}
          >
            <Typography
              sx={{
                fontSize: '7pt',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#777',
                mb: '3px',
              }}
            >
              {tx('pos.invoice.customer')}
            </Typography>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              {clientFullName && (
                <MetaRow label={tx('common.table.name')} value={clientFullName} />
              )}
              {clientPhone && (
                <MetaRow label={tx('common.table.phone')} value={clientPhone} />
              )}
            </Stack>
          </Box>
        )}

        {/* ── PRODUCTS TABLE ───────────────────────────────────────────── */}
        <Box sx={{ px: '8mm', pt: '4mm' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '9pt',
            }}
          >
            <thead>
              <tr>
                <Th align="center" width="28px">#</Th>
                <Th align="left">{tx('common.table.product')}</Th>
                <Th align="right" width="52px">{tx('common.table.qty')}</Th>
                <Th align="right" width="80px">{tx('common.table.price')}</Th>
                <Th align="right" width="88px">{tx('common.labels.total')}</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.unitPrice;
                const isLast = idx === items.length - 1;
                return (
                  <tr key={idx}>
                    <Td
                      align="center"
                      style={{ color: '#999', borderBottom: isLast ? 'none' : '1px solid #eee' }}
                    >
                      {idx + 1}
                    </Td>
                    <Td style={{ borderBottom: isLast ? 'none' : '1px solid #eee' }}>
                      {item.name}
                    </Td>
                    <Td
                      align="right"
                      style={{ borderBottom: isLast ? 'none' : '1px solid #eee' }}
                    >
                      {item.quantity}
                    </Td>
                    <Td
                      align="right"
                      style={{ borderBottom: isLast ? 'none' : '1px solid #eee' }}
                    >
                      {fCurrency(item.unitPrice)}
                    </Td>
                    <Td
                      align="right"
                      style={{
                        fontWeight: 600,
                        borderBottom: isLast ? 'none' : '1px solid #eee',
                      }}
                    >
                      {fCurrency(lineTotal)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>

        {/* ── TOTALS ───────────────────────────────────────────────────── */}
        <Box
          sx={{
            px: '8mm',
            pt: '3mm',
            pb: '5mm',
            borderTop: '2px solid #111',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '3px',
          }}
        >
          {subtotal !== totalAmount && (
            <TotalRow
              label={tx('pos.invoice.subtotal')}
              value={fCurrency(subtotal)}
            />
          )}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              sx={{
                fontSize: '12pt',
                fontWeight: 700,
                color: '#111',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {tx('common.labels.total')}:
            </Typography>
            <Typography
              sx={{
                fontSize: '15pt',
                fontWeight: 800,
                color: '#111',
                minWidth: 96,
                textAlign: 'right',
              }}
            >
              {fCurrency(totalAmount)}
            </Typography>
          </Stack>
        </Box>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <Box
          sx={{
            borderTop: '1px solid #ccc',
            px: '8mm',
            py: '5mm',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '10pt',
              fontWeight: 500,
              color: '#333',
            }}
          >
            {tx('pos.invoice.thankYou')}
          </Typography>
        </Box>
      </Box>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="baseline">
      <Typography
        component="span"
        sx={{ fontSize: '8pt', color: '#777', whiteSpace: 'nowrap' }}
      >
        {label}:
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: '8.5pt', fontWeight: 600, color: '#111' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography sx={{ fontSize: '9pt', color: '#777' }}>{label}:</Typography>
      <Typography sx={{ fontSize: '9pt', fontWeight: 600, minWidth: 96, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function Th({
  children,
  align = 'left',
  width,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '4px 6px',
        borderBottom: '2px solid #111',
        fontSize: '7.5pt',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#444',
        width: width ?? undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  style,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        textAlign: align,
        padding: '5px 6px',
        fontSize: '9pt',
        verticalAlign: 'top',
        ...style,
      }}
    >
      {children}
    </td>
  );
}
