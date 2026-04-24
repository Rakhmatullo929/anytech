import { useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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

function getRoleColor(role: string): 'error' | 'warning' | 'info' {
  if (role === 'admin') return 'error';
  if (role === 'manager') return 'warning';
  return 'info';
}

const ADMIN_LOCKED_PAGES = new Set(['admin', 'roles', 'users']);
const ACTIONS_ORDER = ['read', 'detail', 'write'] as const;

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
  const [newRoleName, setNewRoleName] = useState('');
  const [createAttempted, setCreateAttempted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const canWriteRoles = canWritePage('roles');

  useEffect(() => {
    const next: Record<string, Set<string>> = {};
    roles.forEach((role) => {
      next[role.value] = new Set(role.permissions);
    });
    setDraftPermissions(next);
    setExpandedRole(roles.length ? roles[0].value : false);
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

  const createRole = async () => {
    setCreateAttempted(true);
    const name = newRoleName.trim();
    if (!name) return;
    try {
      await createMutation.mutateAsync({ name });
      setNewRoleName('');
      setCreateAttempted(false);
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
    setCreateAttempted(false);
    setNewRoleName('');
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setCreateAttempted(false);
    setNewRoleName('');
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
              {tx('common.dictionary.create')}
            </Button>
          </Can>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <AdminTabs value="roles" />

      <Card sx={{ p: 2 }}>
        {isPending ? <LinearProgress sx={{ mb: 2 }} /> : null}
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
                const currentDraft = Array.from(draftPermissions[role.value] || []).sort();
                const initialPermissions = [...role.permissions].sort();
                const hasChanges =
                  currentDraft.length !== initialPermissions.length ||
                  currentDraft.some((item, index) => item !== initialPermissions[index]);
                const selectedCount = availablePermissions.filter((permission) =>
                  roleDraftSet.has(permission)
                ).length;
                const allChecked =
                  availablePermissions.length > 0 && selectedCount === availablePermissions.length;
                const partiallyChecked = selectedCount > 0 && selectedCount < availablePermissions.length;
                const roleAllDisabled = !canWriteRoles || availablePermissions.length === 0;

                return (
              <Accordion
                key={role.value}
                expanded={expandedRole === role.value}
                onChange={(_, expanded) => setExpandedRole(expanded ? role.value : false)}
                disableGutters
                sx={{ borderRadius: 1, '&:before': { display: 'none' }, border: (theme) => `1px solid ${theme.palette.divider}` }}
              >
                <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={18} />}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: 1, pr: 1 }}>
                    <Stack spacing={0.25}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 700 }}>{role.label || role.value}</Typography>
                        {hasChanges ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'warning.main',
                              }}
                            />
                            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                              {tx('admin.roles.unsavedChanges')}
                            </Typography>
                          </Stack>
                        ) : null}
                      </Stack>
                        <Typography variant="body2" color="text.secondary">{role.value}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        size="small"
                        variant="soft"
                        color={getRoleColor(role.value)}
                        label={role.label || role.value}
                      />
                      {!role.isSystem && canWriteRoles ? (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeRole(role.value)}
                          disabled={deleteMutation.isPending}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      ) : null}
                    </Stack>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0.5 }}>
                  <Stack spacing={1}>
                    <Stack
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
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {tx('admin.roles.allPermissions')}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={allChecked}
                            indeterminate={partiallyChecked}
                            disabled={roleAllDisabled}
                            onChange={(_, enabled) => toggleAllRolePermissions(role.value, enabled)}
                          />
                        }
                        label={tx('common.table.allOption')}
                      />
                    </Stack>

                    {pageKeys.map((page) => {
                      const actions = ACTIONS_ORDER.filter((action) =>
                        (pageActions[page] || new Set()).has(action)
                      );
                      const pagePermissions = actions.map((action) => `${page}:${action}`);
                      const isLockedPage = role.value === 'admin' && ADMIN_LOCKED_PAGES.has(page);
                      const selectedInPage = pagePermissions.filter((permission) =>
                        roleDraftSet.has(permission)
                      ).length;
                      const allPageChecked = pagePermissions.length > 0 && selectedInPage === pagePermissions.length;
                      const partiallyPageChecked = selectedInPage > 0 && selectedInPage < pagePermissions.length;

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
                            {tx(`admin.roles.pages.${page}`)}
                          </Typography>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ sm: 'center' }}
                          >
                            <Stack direction="row" spacing={2}>
                              {actions.map((action) => {
                                const permission = `${page}:${action}`;
                                const checked = roleDraftSet.has(permission);

                                return (
                                  <FormControlLabel
                                    key={`${role.value}-${permission}`}
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={checked}
                                        disabled={!canWriteRoles || isLockedAdminPermission(role.value, permission)}
                                        onChange={(_, enabled) => togglePermission(role.value, permission, enabled)}
                                      />
                                    }
                                    label={tx(`admin.roles.${action}`)}
                                  />
                                );
                              })}
                            </Stack>
                            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={allPageChecked}
                                  indeterminate={partiallyPageChecked}
                                  disabled={!canWriteRoles || pagePermissions.length === 0 || isLockedPage}
                                  onChange={(_, enabled) =>
                                    togglePagePermissions(role.value, pagePermissions, enabled)
                                  }
                                />
                              }
                              label={tx('common.table.allOption')}
                            />
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>

                  <Can page="roles" action="write">
                    {hasChanges ? (
                      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                        <Button
                          variant="contained"
                          onClick={() => saveRolePermissions(role.value)}
                          disabled={updateMutation.isPending}
                        >
                          {tx('common.actions.save')}
                        </Button>
                      </Stack>
                    ) : null}
                  </Can>
                </AccordionDetails>
              </Accordion>
                );
            })}
          </Stack>
        )}
      </Card>

      <Can page="roles" action="write">
        <Dialog open={createOpen} onClose={handleCloseCreate} fullWidth maxWidth="xs">
          <DialogTitle>{tx('admin.roles.dialogs.create.title')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label={tx('admin.roles.dialogs.create.fields.name')}
              value={newRoleName}
              error={createAttempted && !newRoleName.trim()}
              helperText={
                createAttempted && !newRoleName.trim() ? tx('common.validation.roleRequired') : ' '
              }
              onChange={(event) => {
                setNewRoleName(String(event.target.value || ''));
                if (createAttempted) setCreateAttempted(false);
              }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate}>{tx('common.actions.cancel')}</Button>
            <Button variant="contained" onClick={createRole} disabled={createMutation.isPending}>
              {tx('common.dictionary.create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Can>
    </>
  );
}
