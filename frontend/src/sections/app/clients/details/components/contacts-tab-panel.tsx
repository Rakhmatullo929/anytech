import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

type Props = {
  phoneTitle: string;
  socialTitle: string;
  phones: string[];
  socialItems: Array<{ key: string; icon: string; label: string; value: string }>;
  emptyLabel: string;
};

export default function ContactsTabPanel({ phoneTitle, socialTitle, phones, socialItems, emptyLabel }: Props) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {phoneTitle}
      </Typography>
      <Stack gap={1}>
        {phones.length ? (
          phones.map((phone) => (
            <Stack key={phone} direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:phone-bold" width={16} />
              <Typography variant="body2">{phone}</Typography>
            </Stack>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            {emptyLabel}
          </Typography>
        )}
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {socialTitle}
      </Typography>
      <Stack spacing={1.2}>
        {socialItems.map((item) => (
          <Stack key={item.key} direction="row" spacing={1.25} alignItems="center">
            <Iconify icon={item.icon} width={16} />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
              {item.label}
            </Typography>
            <Typography variant="body2" noWrap>
              {item.value || emptyLabel}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
