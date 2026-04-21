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
import Typography from '@mui/material/Typography';

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
  DEFAULT_PHONE_COUNTRY,
  formatPhoneLocalInput,
  getClientPhoneRule,
  parseE164Phone,
  toE164Phone,
} from 'src/sections/app/clients/form/utils/phone-format';

import {
  useCreateTenantUserMutation,
  useDistrictsQuery,
  useRegionsQuery,
  useTenantUserDetailQuery,
  useUpdateTenantUserMutation,
} from '../api';
import { UserDetailsSkeleton } from '../skeleton';
import { getUserUpsertSchema } from '../components/utils/user-upsert-schema';

type Props = {
  mode: 'create' | 'edit';
};

type UserFormValues = {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string | null;
  regionId: string;
  districtId: string;
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
  const regionsQuery = useRegionsQuery();
  const passwordVisible = useBoolean();
  const passwordConfirmVisible = useBoolean();

  const schema = getUserUpsertSchema(tx, mode);
  const methods = useForm<UserFormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      birthDate: null,
      regionId: '',
      districtId: '',
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
  const selectedRegionId = methods.watch('regionId');
  const districtsQuery = useDistrictsQuery(selectedRegionId);
  const loading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const currentDistrictId = methods.getValues('districtId');
    if (!currentDistrictId) return;
    if (districtsQuery.data?.some((district) => district.id === currentDistrictId)) return;
    methods.setValue('districtId', '', { shouldDirty: true, shouldValidate: true });
  }, [districtsQuery.data, methods]);

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!detailQuery.data) return;

    const passport = parsePassportSeries(detailQuery.data.passportSeries);

    reset({
      firstName: detailQuery.data.firstName || '',
      lastName: detailQuery.data.lastName || '',
      middleName: detailQuery.data.middleName || '',
      birthDate: detailQuery.data.birthDate || null,
      regionId: detailQuery.data.regionId || '',
      districtId: detailQuery.data.districtId || '',
      phone: parseE164Phone(detailQuery.data.phone || '').local,
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
    const firstName = safeTrim(values.firstName);
    const lastName = safeTrim(values.lastName);
    const middleName = safeTrim(values.middleName);
    const phone = toE164Phone(DEFAULT_PHONE_COUNTRY, values.phone);
    const email = safeTrim(values.email);
    const birthDate = values.birthDate || null;
    const regionId = values.regionId || null;
    const districtId = values.districtId || null;
    const passportPrefix = safeTrim(values.passportSeriesPrefix).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    const passportNumber = safeTrim(values.passportSeriesNumber).replace(/\D/g, '').slice(0, 7);
    const passportSeries = passportPrefix && passportNumber ? `${passportPrefix}${passportNumber}` : null;
    const gender = values.gender || null;
    const password = safeTrim(values.password);
    const passwordConfirm = safeTrim(values.passwordConfirm);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          firstName,
          lastName: lastName || '',
          middleName: middleName || '',
          birthDate,
          regionId,
          districtId,
          phone,
          email: email || null,
          passportSeries,
          gender,
          role: values.role,
          password,
          passwordConfirm,
        });
        enqueueSnackbar(tx('users.toasts.created'), { variant: 'success' });
      } else {
        await updateMutation.mutateAsync({
          id,
          firstName,
          lastName: lastName || '',
          middleName: middleName || '',
          birthDate,
          regionId,
          districtId,
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
        enqueueSnackbar(tx('users.toasts.updated'), { variant: 'success' });
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
        title={tx('users.detail.notFound')}
        action={
          <Button onClick={() => router.push(paths.admin.users.root)} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={mode === 'create' ? tx('users.dialogs.create.title') : tx('users.dialogs.edit.title')}
        links={[
          { name: tx('common.navigation.admin'), href: paths.admin.users.root },
          { name: tx('admin.tabs.users'), href: paths.admin.users.root },
          {
            name: mode === 'create' ? tx('users.dialogs.create.title') : tx('users.dialogs.edit.title'),
            href: mode === 'create' ? paths.admin.users.create : paths.admin.users.edit(id),
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">{tx('clients.form.sections.personal')}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ width: { xs: 1, sm: '34%' } }}>
                  <RHFTextField name="firstName" label={`${tx('clients.form.fields.name')} *`} />
                </Box>
                <Box sx={{ width: { xs: 1, sm: '33%' } }}>
                  <RHFTextField name="lastName" label={tx('clients.form.fields.lastName')} />
                </Box>
                <Box sx={{ width: { xs: 1, sm: '33%' } }}>
                  <RHFTextField name="middleName" label={tx('clients.form.fields.middleName')} />
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField
                    name="birthDate"
                    type="date"
                    label={`${tx('clients.form.fields.birthDate')} *`}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField name="gender" label={`${tx('common.table.gender')} *`} select>
                    <MenuItem value="male">{tx('users.genders.male')}</MenuItem>
                    <MenuItem value="female">{tx('users.genders.female')}</MenuItem>
                  </RHFTextField>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField
                    name="regionId"
                    select
                    label={`${tx('users.form.region')} *`}
                    onChange={(event) => {
                      const nextRegionId = String(event.target.value || '');
                      methods.setValue('regionId', nextRegionId, { shouldDirty: true, shouldValidate: true });
                      methods.setValue('districtId', '', { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    <MenuItem value="">-</MenuItem>
                    {(regionsQuery.data || []).map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </RHFTextField>
                </Box>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField
                    name="districtId"
                    select
                    label={`${tx('clients.form.fields.city')} *`}
                    disabled={!selectedRegionId}
                  >
                    <MenuItem value="">-</MenuItem>
                    {(districtsQuery.data || []).map((district) => (
                      <MenuItem key={district.id} value={district.id}>
                        {district.name}
                      </MenuItem>
                    ))}
                  </RHFTextField>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ width: { xs: 1, sm: '34%' } }}>
                  <RHFTextField
                    name="passportSeriesPrefix"
                    label={tx('users.form.passportPrefix')}
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
                    label={tx('users.form.passportNumber')}
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
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">{tx('clients.form.sections.phones')}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField
                    name="phone"
                    label={`${tx('common.table.phone')} *`}
                    inputProps={{ inputMode: 'numeric' }}
                    onChange={(event) => {
                      const masked = formatPhoneLocalInput(event.target.value, DEFAULT_PHONE_COUNTRY);
                      methods.setValue('phone', masked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Iconify icon="flagpack:uz" width={16} />
                            <span>{getClientPhoneRule(DEFAULT_PHONE_COUNTRY).prefix}</span>
                          </Stack>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField name="email" label={tx('common.table.email')} />
                </Box>
              </Stack>
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">{tx('users.table.role')}</Typography>
              <RHFTextField name="role" label={`${tx('users.table.role')} *`} select>
                <MenuItem value="admin">{tx('users.roles.admin')}</MenuItem>
                <MenuItem value="manager">{tx('users.roles.manager')}</MenuItem>
                <MenuItem value="seller">{tx('users.roles.seller')}</MenuItem>
              </RHFTextField>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField
                    name="password"
                    type={passwordVisible.value ? 'text' : 'password'}
                    label={mode === 'create' ? `${tx('common.table.password')} *` : tx('users.dialogs.edit.newPassword')}
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
                </Box>
                <Box sx={{ width: { xs: 1, sm: '50%' } }}>
                  <RHFTextField
                    name="passwordConfirm"
                    type={passwordConfirmVisible.value ? 'text' : 'password'}
                    label={
                      mode === 'create'
                        ? `${tx('users.dialogs.create.confirmPassword')} *`
                        : tx('users.dialogs.edit.confirmNewPassword')
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
                </Box>
              </Stack>
            </Stack>
          </Card>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button onClick={() => router.push(paths.admin.users.root)}>{tx('common.actions.cancel')}</Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {tx('common.actions.save')}
            </Button>
          </Stack>
        </Stack>
      </FormProvider>
    </>
  );
}
