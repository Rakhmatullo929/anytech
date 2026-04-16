import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import type { ClientDetailsTabValue } from './types';

type Props = {
  value: ClientDetailsTabValue;
  onChange: (next: ClientDetailsTabValue) => void;
  labels: Record<ClientDetailsTabValue, string>;
};

const ORDER: ClientDetailsTabValue[] = ['overview', 'contacts', 'addresses', 'purchases'];

export default function DetailsTabs({ value, onChange, labels }: Props) {
  return (
    <Tabs
      value={value}
      onChange={(_, nextValue: ClientDetailsTabValue) => onChange(nextValue)}
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
