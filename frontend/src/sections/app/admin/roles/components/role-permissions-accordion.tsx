import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

import Can from 'src/auth/components/can';
import Iconify from 'src/components/iconify';

import type { TenantRole } from '../api';

const ACTIONS_ORDER = ['read', 'detail', 'write'] as const;
const ADMIN_LOCKED_PAGES = new Set(['admin', 'roles', 'users']);

function getRoleColor(role: string): 'error' | 'warning' | 'info' {
  if (role === 'admin') return 'error';
  if (role === 'manager') return 'warning';
  return 'info';
}

function isLockedAdminPermission(role: string, permission: string) {
  if (role !== 'admin') return false;
  const [page] = permission.split(':');
  return ADMIN_LOCKED_PAGES.has(page);
}

type Props = {
  role: TenantRole;
  expanded: boolean;
  onExpand: (expanded: boolean) => void;
  canWriteRoles: boolean;
  availablePermissions: string[];
  pageKeys: string[];
  pageActions: Record<string, Set<string>>;
  roleDraftSet: Set<string>;
  hasChanges: boolean;
  updatePending: boolean;
  deletePending: boolean;
  tx: (key: string, options?: Record<string, string | number>) => string;
  onTogglePermission: (permission: string, enabled: boolean) => void;
  onTogglePagePermissions: (permissions: string[], enabled: boolean) => void;
  onToggleAllPermissions: (enabled: boolean) => void;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function RolePermissionsAccordion({
  role,
  expanded,
  onExpand,
  canWriteRoles,
  availablePermissions,
  pageKeys,
  pageActions,
  roleDraftSet,
  hasChanges,
  updatePending,
  deletePending,
  tx,
  onTogglePermission,
  onTogglePagePermissions,
  onToggleAllPermissions,
  onSave,
  onEdit,
  onDelete,
}: Props) {
  const selectedCount = availablePermissions.filter((permission) => roleDraftSet.has(permission)).length;
  const allChecked = availablePermissions.length > 0 && selectedCount === availablePermissions.length;
  const partiallyChecked = selectedCount > 0 && selectedCount < availablePermissions.length;
  const roleAllDisabled = !canWriteRoles || availablePermissions.length === 0;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, nextExpanded) => onExpand(nextExpanded)}
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
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip size="small" variant="soft" color={getRoleColor(role.value)} label={role.label || role.value} />
            {!role.isSystem && canWriteRoles ? (
              <>
                <IconButton size="small" color="default" onClick={onEdit}>
                  <Iconify icon="solar:pen-bold" width={16} />
                </IconButton>
                <IconButton size="small" color="error" onClick={onDelete} disabled={deletePending}>
                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                </IconButton>
              </>
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
                  onChange={(_, enabled) => onToggleAllPermissions(enabled)}
                />
              }
              label={tx('common.table.allOption')}
            />
          </Stack>

          {pageKeys.map((page) => {
            const actions = ACTIONS_ORDER.filter((action) => (pageActions[page] || new Set()).has(action));
            const pagePermissions = actions.map((action) => `${page}:${action}`);
            const isLockedPage = role.value === 'admin' && ADMIN_LOCKED_PAGES.has(page);
            const selectedInPage = pagePermissions.filter((permission) => roleDraftSet.has(permission)).length;
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
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
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
                              onChange={(_, enabled) => onTogglePermission(permission, enabled)}
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
                        onChange={(_, enabled) => onTogglePagePermissions(pagePermissions, enabled)}
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
              <Button variant="contained" onClick={onSave} disabled={updatePending}>
                {tx('common.actions.save')}
              </Button>
            </Stack>
          ) : null}
        </Can>
      </AccordionDetails>
    </Accordion>
  );
}
