import { useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import { useSnackbar } from 'src/components/snackbar';

import AdminTabs from '../users/components/admin-tabs';
import { useTenantRolesQuery, useUpdateTenantRolePermissionsMutation } from './api';

function getRoleColor(role: 'admin' | 'manager' | 'seller'): 'error' | 'warning' | 'info' {
  if (role === 'admin') return 'error';
  if (role === 'manager') return 'warning';
  return 'info';
}

export default function AdminRolesView() {
  const { tx } = useLocales();
  const { enqueueSnackbar } = useSnackbar();
  const { data, isPending } = useTenantRolesQuery();
  const updateMutation = useUpdateTenantRolePermissionsMutation();
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

  useEffect(() => {
    const next: Record<string, Set<string>> = {};
    roles.forEach((role) => {
      next[role.value] = new Set(role.permissions);
    });
    setDraftPermissions(next);
  }, [roles]);

  const togglePermission = (role: 'admin' | 'manager' | 'seller', permission: string, enabled: boolean) => {
    setDraftPermissions((prev) => {
      const current = new Set(prev[role] || []);
      if (enabled) current.add(permission);
      else current.delete(permission);
      return { ...prev, [role]: current };
    });
  };

  const saveRolePermissions = async (role: 'admin' | 'manager' | 'seller') => {
    const permissions = Array.from(draftPermissions[role] || []).sort();
    try {
      await updateMutation.mutateAsync({ role, permissions });
      enqueueSnackbar(tx('pages.admin.roles.toasts.saved'), { variant: 'success' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={tx('layout.nav.admin')}
        links={[
          { name: tx('layout.nav.admin'), href: paths.admin.users.root },
          { name: tx('pages.admin.tabs.roles'), href: paths.admin.roles },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <AdminTabs value="roles" />

      <Card sx={{ p: 2 }}>
        {isPending ? <LinearProgress sx={{ mb: 2 }} /> : null}
        <Stack spacing={0.5} sx={{ px: 1, pt: 0.5, pb: 1.5 }}>
          <Typography variant="subtitle1">{tx('pages.admin.roles.list_title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tx('pages.admin.roles.list_hint')}
          </Typography>
        </Stack>

        {!isPending && roles.length === 0 ? (
          <EmptyContent title={tx('shared.table.no_data')} />
        ) : (
          <Stack spacing={2}>
            {roles.map((role, index) => (
              <Stack key={role.value} spacing={1.5} sx={{ px: 1, py: 1 }}>
                {index > 0 && <Divider />}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontWeight: 700 }}>{tx(`pages.users.roles.${role.value}`)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tx(`pages.admin.roles.items.${role.value}`)}
                    </Typography>
                  </Stack>
                  <Chip
                    size="small"
                    variant="soft"
                    color={getRoleColor(role.value)}
                    label={tx(`pages.users.roles.${role.value}`)}
                  />
                </Stack>

                <Stack spacing={1}>
                  {pageKeys.map((page) => {
                    const actions = ['read', 'detail', 'write'].filter((action) =>
                      (pageActions[page] || new Set()).has(action)
                    );

                    return (
                      <Stack
                        key={`${role.value}-${page}`}
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ sm: 'center' }}
                        justifyContent="space-between"
                        sx={{
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tx(`pages.admin.roles.pages.${page}`)}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          {actions.map((action) => {
                            const permission = `${page}:${action}`;
                            const checked = (draftPermissions[role.value] || new Set()).has(permission);

                            return (
                              <FormControlLabel
                                key={`${role.value}-${permission}`}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={checked}
                                    onChange={(_, enabled) =>
                                      togglePermission(role.value, permission, enabled)
                                    }
                                  />
                                }
                                label={tx(`pages.admin.roles.${action}`)}
                              />
                            );
                          })}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={() => saveRolePermissions(role.value)}
                    disabled={updateMutation.isPending}
                  >
                    {tx('shared.actions.save')}
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </>
  );
}
