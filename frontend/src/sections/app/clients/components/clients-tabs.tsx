import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import type { ClientsTabValue } from './types';

type Props = {
  value: ClientsTabValue;
  onChange: (next: ClientsTabValue) => void;
  labels: Record<ClientsTabValue, string>;
};

const ORDER: ClientsTabValue[] = ['clients', 'groups'];

export default function ClientsTabs({ value, onChange, labels }: Props) {
  return (
    <Tabs
      value={value}
      onChange={(_, nextValue: ClientsTabValue) => onChange(nextValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 2 }}
    >
      {ORDER.map((tab) => (
        <Tab key={tab} value={tab} label={labels[tab]} />
      ))}
    </Tabs>
  );
}
