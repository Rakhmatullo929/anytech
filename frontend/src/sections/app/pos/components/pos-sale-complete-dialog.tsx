import { createPortal } from 'react-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useLocales } from 'src/locales';

import PosInvoicePrint, {
  INVOICE_PRINT_PORTAL_ID,
  type InvoiceData,
} from './pos-invoice-print';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  data: InvoiceData | null;
};

export default function PosSaleCompleteDialog({ open, onClose, data }: Props) {
  const { tx } = useLocales();

  const handlePrint = () => window.print();

  return (
    <>
      {/*
       * Print portal — renders the invoice as a direct child of <body> so the
       * @media print CSS rule (`#pos-invoice-print-portal { visibility: visible }`)
       * can expose it while everything else is hidden.  `display: none` keeps it
       * off-screen when not printing.
       */}
      {data &&
        createPortal(
          <div id={INVOICE_PRINT_PORTAL_ID} style={{ display: 'none' }}>
            <PosInvoicePrint data={data} />
          </div>,
          document.body
        )}

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '92vh' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
          }}
        >
          {tx('pos.invoice.dialogTitle')}
          <IconButton size="small" onClick={onClose} edge="end">
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: 0, bgcolor: 'background.neutral', overflow: 'hidden' }}
        >
          <Scrollbar sx={{ maxHeight: 'calc(92vh - 140px)' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 3,
              }}
            >
              {data && <PosInvoicePrint data={data} />}
            </Box>
          </Scrollbar>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            {tx('common.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={handlePrint}
          >
            {tx('pos.invoice.print')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
