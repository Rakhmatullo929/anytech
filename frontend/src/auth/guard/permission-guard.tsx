import type { ReactNode } from 'react';

import type { PermissionAction, PermissionPage } from 'src/auth/utils/permissions';
import Can from 'src/auth/components/can';
import View403 from 'src/sections/error/403-view';

type PermissionGuardProps = {
  page: PermissionPage;
  action: PermissionAction;
  children: ReactNode;
};

export default function PermissionGuard({ page, action, children }: PermissionGuardProps) {
  return (
    <Can page={page} action={action} fallback={<View403 />}>
      {children}
    </Can>
  );
}
