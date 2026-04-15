import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hook';
import { useBoolean } from 'src/hooks/use-boolean';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import EmptyContent from 'src/components/empty-content';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';

import {
  useCreateTenantUserMutation,
  useTenantUserDetailQuery,
  useUpdateTenantUserMutation,
} from '../api';
import { UserDetailsSkeleton } from '../skeleton';
import { getUserUpsertSchema } from '../components/utils/user-upsert-schema';

type Props = {
  mode: 'create' | 'edit';
};

type UserFormValues = {
  name: string;
  phone: string;
  email: string;
  passportSeriesPrefix: string;
  passportSeriesNumber: string;
  gender: 'male' | 'female' | '';
  role: 'admin' | 'manager' | 'seller';
  password: string;
  passwordConfirm: string;
};

function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePassportSeries(value: string | null | undefined) {
  const normalized = safeTrim(value).toUpperCase();
  if (!normalized) {
    return { prefix: '', number: '' };
  }
  const prefix = normalized.slice(0, 2).replace(/[^A-Z]/g, '');
  const number = normalized.slice(2).replace(/\D/g, '').slice(0, 7);
  return { prefix, number };
}

export default function UserFormView({ mode }: Props) {
  const { tx } = useLocales();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id = '' } = useParams();

  const createMutation = useCreateTenantUserMutation();
  const updateMutation = useUpdateTenantUserMutation();
  const detailQuery = useTenantUserDetailQuery(id);
  const passwordVisible = useBoolean();
  const passwordConfirmVisible = useBoolean();

  const schema = getUserUpsertSchema(tx, mode);
  const methods = useForm<UserFormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      passportSeriesPrefix: '',
      passportSeriesNumber: '',
      gender: '',
      role: 'seller',
      password: '',
      passwordConfirm: '',
    },
  });

  const { reset, handleSubmit } = methods;
  const loading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!detailQuery.data) return;

    const passport = parsePassportSeries(detailQuery.data.passportSeries);

    reset({
      name: detailQuery.data.name || '',
      phone: detailQuery.data.phone || '',
      email: detailQuery.data.email || '',
      passportSeriesPrefix: passport.prefix,
      passportSeriesNumber: passport.number,
      gender: detailQuery.data.gender || '',
      role: detailQuery.data.role,
      password: '',
      passwordConfirm: '',
    });
  }, [detailQuery.data, mode, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const name = safeTrim(values.name);
    const phone = safeTrim(values.phone);
    const email = safeTrim(values.email);
    const passportPrefix = safeTrim(values.passportSeriesPrefix).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    const passportNumber = safeTrim(values.passportSeriesNumber).replace(/\D/g, '').slice(0, 7);
    const passportSeries = passportPrefix && passportNumber ? `${passportPrefix}${passportNumber}` : null;
    const gender = values.gender || null;
    const password = safeTrim(values.password);
    const passwordConfirm = safeTrim(values.passwordConfirm);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          name,
          phone,
          email: email || null,
          passportSeries,
          gender,
          role: values.role,
          password,
          passwordConfirm,
        });
        enqueueSnackbar(tx('pages.users.toasts.created'), { variant: 'success' });
      } else {
        await updateMutation.mutateAsync({
          id,
          name,
          phone,
          email: email || null,
          passportSeries,
          gender,
          role: values.role,
          ...(password || passwordConfirm
            ? {
                password,
                passwordConfirm,
              }
            : {}),
        });
        enqueueSnackbar(tx('pages.users.toasts.updated'), { variant: 'success' });
      }

      router.push(paths.admin.users.root);
    } catch (error) {
      console.error(error);
    }
  });

  if (mode === 'edit' && detailQuery.isPending) {
    return (
      <Box>
        <UserDetailsSkeleton />
      </Box>
    );
  }

  if (mode === 'edit' && !detailQuery.data) {
    return (
      <EmptyContent
        filled
        title={tx('pages.users.detail.not_found')}
        action={
          <Button onClick={() => router.push(paths.admin.users.root)} variant="contained">
            {tx('shared.actions.back_to_list')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={mode === 'create' ? tx('pages.users.dialogs.create.title') : tx('pages.users.dialogs.edit.title')}
        links={[
          { name: tx('layout.nav.admin'), href: paths.admin.users.root },
          { name: tx('pages.admin.tabs.users'), href: paths.admin.users.root },
          {
            name: mode === 'create' ? tx('pages.users.dialogs.create.title') : tx('pages.users.dialogs.edit.title'),
            href: mode === 'create' ? paths.admin.users.create : paths.admin.users.edit(id),
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <RHFTextField name="name" label={`${tx('shared.table.name')} *`} />
            <RHFTextField name="phone" label={`${tx('shared.table.phone')} *`} />
            <RHFTextField name="email" label={tx('shared.table.email')} />
            <RHFTextField name="gender" label={`${tx('shared.table.gender')} *`} select>
              <MenuItem value="male">{tx('pages.users.genders.male')}</MenuItem>
              <MenuItem value="female">{tx('pages.users.genders.female')}</MenuItem>
            </RHFTextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ width: { xs: 1, sm: '34%' } }}>
                <RHFTextField
                  name="passportSeriesPrefix"
                  label={tx('pages.users.form.passport_prefix')}
                  inputProps={{ maxLength: 2 }}
                  onChange={(event) => {
                    methods.setValue(
                      'passportSeriesPrefix',
                      String(event.target.value || '')
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .slice(0, 2),
                      { shouldDirty: true, shouldValidate: true }
                    );
                  }}
                />
              </Box>
              <Box sx={{ width: { xs: 1, sm: '66%' } }}>
                <RHFTextField
                  name="passportSeriesNumber"
                  label={tx('pages.users.form.passport_number')}
                  inputProps={{ maxLength: 7, inputMode: 'numeric' }}
                  onChange={(event) => {
                    methods.setValue(
                      'passportSeriesNumber',
                      String(event.target.value || '')
                        .replace(/\D/g, '')
                        .slice(0, 7),
                      { shouldDirty: true, shouldValidate: true }
                    );
                  }}
                />
              </Box>
            </Stack>
            <RHFTextField name="role" label={`${tx('pages.users.table.role')} *`} select>
              <MenuItem value="admin">{tx('pages.users.roles.admin')}</MenuItem>
              <MenuItem value="manager">{tx('pages.users.roles.manager')}</MenuItem>
              <MenuItem value="seller">{tx('pages.users.roles.seller')}</MenuItem>
            </RHFTextField>
            <RHFTextField
              name="password"
              type={passwordVisible.value ? 'text' : 'password'}
              label={mode === 'create' ? `${tx('shared.table.password')} *` : tx('pages.users.dialogs.edit.new_password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={passwordVisible.onToggle} edge="end">
                      <Iconify
                        icon={passwordVisible.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <RHFTextField
              name="passwordConfirm"
              type={passwordConfirmVisible.value ? 'text' : 'password'}
              label={
                mode === 'create'
                  ? `${tx('pages.users.dialogs.create.confirm_password')} *`
                  : tx('pages.users.dialogs.edit.confirm_new_password')
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={passwordConfirmVisible.onToggle} edge="end">
                      <Iconify
                        icon={passwordConfirmVisible.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={() => router.push(paths.admin.users.root)}>{tx('shared.actions.cancel')}</Button>
              <Button variant="contained" type="submit" disabled={loading}>
                {tx('shared.actions.save')}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </FormProvider>
    </>
  );
}
