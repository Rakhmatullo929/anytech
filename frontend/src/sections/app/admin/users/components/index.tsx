import Label from 'src/components/label';
import AdminTabs from './admin-tabs/index';

type Props = {
  role: string;
  label: string;
};

function getRoleColor(role: string): 'error' | 'warning' | 'info' {
  if (role === 'admin') return 'error';
  if (role === 'manager') return 'warning';
  return 'info';
}

export function UserRoleLabel({ role, label }: Props) {
  return (
    <Label variant="soft" color={getRoleColor(role)}>
      {label}
    </Label>
  );
}

export { AdminTabs };
