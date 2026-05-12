import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

type Props = {
  dateFrom: string;
  dateTo: string;
  labelFrom: string;
  labelTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
};

export default function DateRangeFilter({
  dateFrom,
  dateTo,
  labelFrom,
  labelTo,
  onDateFromChange,
  onDateToChange,
}: Props) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        type="date"
        size="small"
        label={labelFrom}
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />
      <TextField
        type="date"
        size="small"
        label={labelTo}
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 160 }}
      />
    </Stack>
  );
}
