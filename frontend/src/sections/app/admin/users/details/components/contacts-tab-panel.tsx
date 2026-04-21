import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import Iconify from 'src/components/iconify';

type Props = {
  phoneTitle: string;
  contactItems: Array<{ key: string; icon: string; label: string; value: string }>;
  emptyLabel: string;
};

export default function ContactsTabPanel({ phoneTitle, contactItems, emptyLabel }: Props) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {phoneTitle}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={1.2}>
        {contactItems.map((item) => (
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
