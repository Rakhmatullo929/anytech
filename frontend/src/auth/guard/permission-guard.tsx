import type { ReactNode } from 'react';

import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import type { PermissionAction, PermissionPage } from 'src/auth/utils/permissions';
import View403 from 'src/sections/error/403-view';

type PermissionGuardProps = {
  page: PermissionPage;
  action: PermissionAction;
  children: ReactNode;
};

export default function PermissionGuard({ page, action, children }: PermissionGuardProps) {
  const { cp } = useCheckPermission();
  const allowed = cp(page, action);

  if (!allowed) {
    return <View403 />;
  }

  return <>{children}</>;
}
