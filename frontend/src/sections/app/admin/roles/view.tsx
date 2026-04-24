import { useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { useCheckPermission } from 'src/auth/hooks/use-check-permission';
import Can from 'src/auth/components/can';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import { useSnackbar } from 'src/components/snackbar';

import AdminTabs from '../users/components/admin-tabs';
import {
  useCreateTenantRoleMutation,
  useDeleteTenantRoleMutation,
  useTenantRolesQuery,
  useUpdateTenantRolePermissionsMutation,
} from './api';
import { RoleCreateDialog, RolePermissionsAccordion } from './components';
import { RolesListSkeleton } from './skeleton';

const ADMIN_LOCKED_PAGES = new Set(['admin', 'roles', 'users']);

function isLockedAdminPermission(role: string, permission: string) {
  if (role !== 'admin') return false;
  const [page] = permission.split(':');
  return ADMIN_LOCKED_PAGES.has(page);
}

export default function AdminRolesView() {
  const { tx } = useLocales();
  const { canWritePage } = useCheckPermission();
  const { enqueueSnackbar } = useSnackbar();
  const { data, isPending } = useTenantRolesQuery();
  const updateMutation = useUpdateTenantRolePermissionsMutation();
  const createMutation = useCreateTenantRoleMutation();
  const deleteMutation = useDeleteTenantRoleMutation();
  const roles = useMemo(() => data?.results ?? [], [data]);
  const availablePermissions = useMemo(() => data?.availablePermissions ?? [], [data]);

  const pageKeys = useMemo(
    () => Array.from(new Set(availablePermissions.map((item) => item.split(':')[0]).filter(Boolean))),
    [availablePermissions]
  );
  const pageActions = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    availablePermissions.forEach((permission) => {
      const [page, action] = permission.split(':');
      if (!page || !action) return;
      map[page] = map[page] || new Set<string>();
      map[page].add(action);
    });
    return map;
  }, [availablePermissions]);

  const [draftPermissions, setDraftPermissions] = useState<Record<string, Set<string>>>({});
  const [expandedRole, setExpandedRole] = useState<string | false>(false);
  const [createOpen, setCreateOpen] = useState(false);
  const canWriteRoles = canWritePage('roles');

  useEffect(() => {
    const next: Record<string, Set<string>> = {};
    roles.forEach((role) => {
      next[role.value] = new Set(role.permissions);
    });
    setDraftPermissions(next);
    setExpandedRole(false);
  }, [roles]);

  const togglePermission = (role: string, permission: string, enabled: boolean) => {
    setDraftPermissions((prev) => {
      const current = new Set(prev[role] || []);
      if (enabled) current.add(permission);
      else current.delete(permission);
      return { ...prev, [role]: current };
    });
  };

  const togglePagePermissions = (
    role: string,
    permissions: string[],
    enabled: boolean
  ) => {
    setDraftPermissions((prev) => {
      const current = new Set(prev[role] || []);
      permissions.forEach((permission) => {
        if (enabled) current.add(permission);
        else current.delete(permission);
      });
      return { ...prev, [role]: current };
    });
  };

  const toggleAllRolePermissions = (role: string, enabled: boolean) => {
    setDraftPermissions((prev) => {
      if (enabled) return { ...prev, [role]: new Set(availablePermissions) };
      if (role === 'admin') {
        const preserved = availablePermissions.filter((permission) =>
          isLockedAdminPermission(role, permission)
        );
        return { ...prev, [role]: new Set(preserved) };
      }
      return { ...prev, [role]: new Set<string>() };
    });
  };

  const saveRolePermissions = async (role: string) => {
    const permissions = Array.from(draftPermissions[role] || []).sort();
    try {
      await updateMutation.mutateAsync({ role, permissions });
      enqueueSnackbar(tx('admin.roles.toasts.saved'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  const createRole = async (values: { name: string }) => {
    const name = values.name.trim();
    if (!name) return;
    try {
      await createMutation.mutateAsync({ name });
      setCreateOpen(false);
      enqueueSnackbar(tx('admin.roles.toasts.saved'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  const removeRole = async (role: string) => {
    try {
      await deleteMutation.mutateAsync(role);
      enqueueSnackbar(tx('admin.roles.toasts.saved'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenCreate = () => {
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('common.navigation.admin')}
        links={[
          { name: tx('common.navigation.admin'), href: paths.admin.users.root },
          { name: tx('admin.tabs.roles'), href: paths.admin.roles },
        ]}
        action={
          <Can page="roles" action="write">
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
              {tx('admin.roles.dialogs.create.submit')}
            </Button>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <AdminTabs value="roles" />

      {isPending ? (
        <RolesListSkeleton />
      ) : (
      <Card sx={{ p: 2 }}>
        <Stack spacing={0.5} sx={{ px: 1, pt: 0.5, pb: 1.5 }}>
          <Typography variant="subtitle1">{tx('admin.roles.listTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tx('admin.roles.listHint')}
          </Typography>
        </Stack>

        {!isPending && roles.length === 0 ? (
          <EmptyContent title={tx('common.table.noData')} />
        ) : (
          <Stack spacing={2}>
            {roles.map((role) => {
              const roleDraftSet = draftPermissions[role.value] || new Set<string>();
              const currentDraft = Array.from(roleDraftSet).sort();
              const initialPermissions = [...role.permissions].sort();
              const hasChanges =
                currentDraft.length !== initialPermissions.length ||
                currentDraft.some((item, index) => item !== initialPermissions[index]);

              return (
                <RolePermissionsAccordion
                  key={role.value}
                  role={role}
                  expanded={expandedRole === role.value}
                  onExpand={(expanded) => setExpandedRole(expanded ? role.value : false)}
                  canWriteRoles={canWriteRoles}
                  availablePermissions={availablePermissions}
                  pageKeys={pageKeys}
                  pageActions={pageActions}
                  roleDraftSet={roleDraftSet}
                  hasChanges={hasChanges}
                  updatePending={updateMutation.isPending}
                  deletePending={deleteMutation.isPending}
                  tx={tx}
                  onTogglePermission={(permission, enabled) =>
                    togglePermission(role.value, permission, enabled)
                  }
                  onTogglePagePermissions={(permissions, enabled) =>
                    togglePagePermissions(role.value, permissions, enabled)
                  }
                  onToggleAllPermissions={(enabled) => toggleAllRolePermissions(role.value, enabled)}
                  onSave={() => saveRolePermissions(role.value)}
                  onDelete={() => removeRole(role.value)}
                />
              );
            })}
          </Stack>
        )}
      </Card>
      )}

      <Can page="roles" action="write">
        <RoleCreateDialog
          open={createOpen}
          loading={createMutation.isPending}
          onClose={handleCloseCreate}
          onSubmit={createRole}
        />
      </Can>
    </>
  );
}
