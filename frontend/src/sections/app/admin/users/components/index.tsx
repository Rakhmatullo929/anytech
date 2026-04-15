import Label from 'src/components/label';
import AdminTabs from './admin-tabs/index';

type Props = {
  role: 'admin' | 'manager' | 'seller';
  label: string;
};

const ROLE_COLOR: Record<Props['role'], 'error' | 'warning' | 'info'> = {
  admin: 'error',
  manager: 'warning',
  seller: 'info',
};

export function UserRoleLabel({ role, label }: Props) {
  return (
    <Label variant="soft" color={ROLE_COLOR[role]}>
      {label}
    </Label>
  );
}

export { AdminTabs };
