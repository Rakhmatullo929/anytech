import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import type { UserDetailsTabValue } from './types';

type Props = {
  value: UserDetailsTabValue;
  onChange: (next: UserDetailsTabValue) => void;
  labels: Record<UserDetailsTabValue, string>;
};

const ORDER: UserDetailsTabValue[] = ['overview', 'contacts', 'access'];

export default function DetailsTabs({ value, onChange, labels }: Props) {
  return (
    <Tabs
      value={value}
      onChange={(_, nextValue: UserDetailsTabValue) => onChange(nextValue)}
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
