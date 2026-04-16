import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

type AddressItem = {
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  note?: string;
};

type Props = {
  title: string;
  addresses: AddressItem[];
  emptyLabel: string;
  labels: {
    country: string;
    city: string;
    address: string;
    postalCode: string;
    note: string;
  };
};

export default function AddressesTabPanel({ title, addresses, labels, emptyLabel }: Props) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {addresses.length ? (
        <Stack spacing={1.5}>
          {addresses.map((address, index) => (
            <Card
              key={`${address.country || 'addr'}-${index}`}
              variant="outlined"
              sx={{ p: 1.75, borderRadius: 2, bgcolor: 'background.neutral' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Iconify icon="solar:map-point-bold" width={18} sx={{ mt: 0.25, color: 'primary.main' }} />
                <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2">
                    {[address.country, address.city].filter(Boolean).join(', ') || emptyLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {address.address || emptyLabel}
                  </Typography>

                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {address.postalCode ? (
                      <Chip
                        size="small"
                        variant="soft"
                        icon={<Iconify icon="solar:letter-bold" width={14} />}
                        label={`${labels.postalCode}: ${address.postalCode}`}
                      />
                    ) : null}
                    {address.note ? (
                      <Chip
                        size="small"
                        variant="soft"
                        color="info"
                        icon={<Iconify icon="solar:notes-bold" width={14} />}
                        label={`${labels.note}: ${address.note}`}
                      />
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <EmptyContent filled={false} description={emptyLabel} />
      )}
    </Card>
  );
}
