import { useRef, useState } from 'react';
import { useLocales } from 'src/locales';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Iconify from 'src/components/iconify';

import { downloadProductExcelTemplate } from '../api/products-requests';
import type { BulkCreateProductsResult } from '../api/types';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  loading: boolean;
  result: BulkCreateProductsResult | null;
  onClose: () => void;
  onImport: (file: File) => void;
};

export default function ProductBulkImportDialog({ open, loading, result, onClose, onImport }: Props) {
  const { tx } = useLocales();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setSelectedFile(file);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleImport = () => {
    if (!selectedFile) return;
    onImport(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadProductExcelTemplate();
    } catch {
      // download errors are shown by the global handler
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedFile(null);
    onClose();
  };

  const hasErrors = Boolean(result?.errors?.length);
  const hasCreated = Boolean(result && result.created > 0);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{tx('products.bulkImport.title')}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Step 1 – Download template */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {tx('products.bulkImport.stepTemplate')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                downloadingTemplate ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="eva:download-fill" />
                )
              }
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
            >
              {tx('products.bulkImport.downloadTemplate')}
            </Button>
          </Box>

          <Divider />

          {/* Step 2 – Upload file */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {tx('products.bulkImport.stepUpload')}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="eva:attach-fill" />}
                onClick={handlePickFile}
                disabled={loading}
              >
                {tx('products.bulkImport.chooseFile')}
              </Button>
              {selectedFile && (
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
                  {selectedFile.name}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Result summary */}
          {result && (
            <>
              <Divider />
              <Box>
                {hasCreated && (
                  <Alert severity="success" sx={{ mb: hasErrors ? 1.5 : 0 }}>
                    {tx('products.bulkImport.successSummary', { count: result.created })}
                  </Alert>
                )}

                {hasErrors && (
                  <Alert severity="warning">
                    <Typography variant="subtitle2" gutterBottom>
                      {tx('products.bulkImport.errorsSummary', { count: result.errors.length })}
                    </Typography>
                    <List dense disablePadding>
                      {result.errors.map((rowError) => (
                        <ListItem key={rowError.row} disablePadding sx={{ display: 'list-item', pl: 1 }}>
                          <Typography variant="caption">
                            {tx('products.bulkImport.rowLabel', { row: rowError.row })}{' '}
                            {rowError.errors.join(' ')}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}

                {!hasCreated && !hasErrors && (
                  <Alert severity="info">{tx('products.bulkImport.nothingImported')}</Alert>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {tx('common.actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!selectedFile || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {tx('products.bulkImport.importButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
