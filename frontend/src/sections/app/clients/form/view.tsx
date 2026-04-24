import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLocales } from 'src/locales';
import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hook';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content';
import FormProvider, { RHFAutocomplete, RHFTextField } from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { useClientDetailQuery, useCreateClientMutation, useUpdateClientMutation } from '../api/use-clients-api';
import type { ClientAddress, ClientSocialNetworks } from '../api/types';
import { useGroupsListQuery } from '../groups/api/use-groups-api';
import { getClientFormSchema } from './utils/client-form-schema';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneLocalInput,
  getClientPhoneRule,
  parseE164Phone,
  type ClientPhoneCountry,
  toE164Phone,
} from './utils/phone-format';

type Props = {
  mode: 'create' | 'edit';
};

type ClientFormValues = {
  name: string;
  lastName: string;
  middleName: string;
  birthDate: string | null;
  gender: string;
  maritalStatus: string;
  phones: { country: ClientPhoneCountry; number: string }[];
  addresses: ClientAddress[];
  socialNetworks: ClientSocialNetworks;
  groups: string[];
};

function normalizePhones(phones: { country: ClientPhoneCountry; number: string }[]) {
  const normalized = phones
    .map((item) => toE164Phone(item.country, item.number))
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length ? normalized : [''];
}

export default function ClientFormView({ mode }: Props) {
  const { tx } = useLocales();
  const { id = '' } = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const detailQuery = useClientDetailQuery(id);
  const groupsQuery = useGroupsListQuery({
    page: 1,
    pageSize: 200,
    ordering: 'name',
  });

  const methods = useForm<ClientFormValues>({
    resolver: yupResolver(getClientFormSchema(tx)),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      lastName: '',
      middleName: '',
      birthDate: null,
      gender: '',
      maritalStatus: '',
      phones: [{ country: DEFAULT_PHONE_COUNTRY, number: '' }],
      addresses: [{ country: '', city: '', address: '', postalCode: '', note: '' }],
      socialNetworks: {
        email: '',
        telegram: '',
        instagram: '',
        facebook: '',
      },
      groups: [],
    },
  });

  const { control, handleSubmit, reset } = methods;

  const phonesFieldArray = useFieldArray({
    control,
    name: 'phones',
  });
  const addressesFieldArray = useFieldArray({
    control,
    name: 'addresses',
  });

  useEffect(() => {
    if (mode !== 'edit' || !detailQuery.data) return;

    reset({
      name: detailQuery.data.name || '',
      lastName: detailQuery.data.lastName || '',
      middleName: detailQuery.data.middleName || '',
      birthDate: detailQuery.data.birthDate || null,
      gender: detailQuery.data.gender || '',
      maritalStatus: detailQuery.data.maritalStatus || '',
      phones: (detailQuery.data.phones || []).map((phone) => {
        const parsed = parseE164Phone(phone);
        return {
          country: parsed.country,
          number: parsed.local,
        };
      }),
      addresses:
        detailQuery.data.addresses && detailQuery.data.addresses.length
          ? detailQuery.data.addresses
          : [{ country: '', city: '', address: '', postalCode: '', note: '' }],
      socialNetworks: detailQuery.data.socialNetworks || {
        email: '',
        telegram: '',
        instagram: '',
        facebook: '',
      },
      groups: detailQuery.data.groups || [],
    });
  }, [detailQuery.data, mode, reset]);

  const groupOptions = (groupsQuery.data?.results ?? []).map((group) => ({
    value: group.id,
    label: group.name,
  }));
  const groupIds = groupOptions.map((option) => option.value);
  const groupLabelById = new Map(groupOptions.map((option) => [option.value, option.label]));

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName.trim(),
      birthDate: values.birthDate || null,
      gender: values.gender.trim(),
      maritalStatus: values.maritalStatus.trim(),
      phones: normalizePhones(values.phones),
      addresses: values.addresses.map((address) => ({
        country: address.country?.trim() || '',
        city: address.city?.trim() || '',
        address: address.address?.trim() || '',
        postalCode: address.postalCode?.trim() || '',
        note: address.note?.trim() || '',
      })),
      socialNetworks: {
        email: values.socialNetworks.email?.trim() || '',
        telegram: values.socialNetworks.telegram?.trim() || '',
        instagram: values.socialNetworks.instagram?.trim() || '',
        facebook: values.socialNetworks.facebook?.trim() || '',
      },
      groups: values.groups,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        enqueueSnackbar(tx('clients.toasts.created'), { variant: 'success' });
      } else {
        await updateMutation.mutateAsync({ id, ...payload });
        enqueueSnackbar(tx('clients.toasts.updated'), { variant: 'success' });
      }
      router.push(paths.clients.root);
    } catch (error) {
      console.error(error);
    }
  });

  if (mode === 'edit' && detailQuery.isPending) {
    return <Box />;
  }

  if (mode === 'edit' && !detailQuery.data) {
    return (
      <EmptyContent
        filled
        title={tx('clients.detail.notFound')}
        action={
          <Button onClick={() => router.push(paths.clients.root)} variant="contained">
            {tx('common.actions.backToList')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={mode === 'create' ? tx('clients.form.createTitle') : tx('clients.form.editTitle')}
        links={[
          { name: tx('common.navigation.clients'), href: paths.clients.root },
          {
            name: mode === 'create' ? tx('clients.form.createTitle') : tx('clients.form.editTitle'),
            href: mode === 'create' ? paths.clients.create : paths.clients.edit(id),
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {tx('clients.form.sections.personal')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {mode === 'create' ? tx('clients.form.createTitle') : tx('clients.form.editTitle')}
            </Typography>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                <RHFTextField name="name" label={`${tx('clients.form.fields.name')} *`} />
                <RHFTextField name="lastName" label={tx('clients.form.fields.lastName')} />
                <RHFTextField name="middleName" label={tx('clients.form.fields.middleName')} />
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                <RHFTextField
                  name="birthDate"
                  type="date"
                  label={tx('clients.form.fields.birthDate')}
                  InputLabelProps={{ shrink: true }}
                />
                <RHFTextField name="gender" select label={tx('clients.form.fields.gender')}>
                  <MenuItem value="">{tx('common.table.allOption')}</MenuItem>
                  <MenuItem value="male">{tx('users.genders.male')}</MenuItem>
                  <MenuItem value="female">{tx('users.genders.female')}</MenuItem>
                </RHFTextField>
                <RHFTextField name="maritalStatus" select label={tx('clients.form.fields.maritalStatus')}>
                  <MenuItem value="">{tx('common.table.allOption')}</MenuItem>
                  <MenuItem value="married">{tx('clients.form.marital.married')}</MenuItem>
                  <MenuItem value="single">{tx('clients.form.marital.single')}</MenuItem>
                </RHFTextField>
              </Box>
              <RHFAutocomplete
                name="groups"
                label={tx('clients.form.fields.groups')}
                multiple
                disableCloseOnSelect
                options={groupIds}
                getOptionLabel={(option) => groupLabelById.get(option) || option}
                isOptionEqualToValue={(option, value) => option === value}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox size="small" disableRipple checked={selected} sx={{ mr: 1 }} />
                    {groupLabelById.get(option) || option}
                  </li>
                )}
              />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">{tx('clients.form.sections.phones')}</Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => phonesFieldArray.append({ country: DEFAULT_PHONE_COUNTRY, number: '' })}
              >
                {tx('clients.form.addPhone')}
              </Button>
            </Stack>
            <Stack spacing={2}>
              {phonesFieldArray.fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1.5}>
                  <RHFTextField
                    name={`phones.${index}.country`}
                    label={tx('clients.form.fields.phoneCountry')}
                    select
                    sx={{ maxWidth: 170 }}
                  >
                    <MenuItem value="uz">🇺🇿 {tx('clients.form.countries.uz')}</MenuItem>
                    <MenuItem value="ru">🇷🇺 {tx('clients.form.countries.ru')}</MenuItem>
                    <MenuItem value="us">🇺🇸 {tx('clients.form.countries.us')}</MenuItem>
                  </RHFTextField>
                  <RHFTextField
                    name={`phones.${index}.number`}
                    label={index === 0 ? `${tx('common.table.phone')} *` : tx('common.table.phone')}
                    inputProps={{ inputMode: 'numeric' }}
                    onChange={(event) => {
                      const country = methods.getValues(`phones.${index}.country`) || DEFAULT_PHONE_COUNTRY;
                      const masked = formatPhoneLocalInput(event.target.value, country);
                      methods.setValue(`phones.${index}.number`, masked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {getClientPhoneRule(
                            methods.watch(`phones.${index}.country`) || DEFAULT_PHONE_COUNTRY
                          ).prefix}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <IconButton
                    color="error"
                    onClick={() => phonesFieldArray.remove(index)}
                    disabled={phonesFieldArray.fields.length === 1}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">{tx('clients.form.sections.addresses')}</Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() =>
                  addressesFieldArray.append({
                    country: '',
                    city: '',
                    address: '',
                    postalCode: '',
                    note: '',
                  })
                }
              >
                {tx('clients.form.addAddress')}
              </Button>
            </Stack>
            <Stack spacing={2}>
              {addressesFieldArray.fields.map((field, index) => (
                <Card key={field.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      }}
                    >
                      <RHFTextField name={`addresses.${index}.country`} label={tx('clients.form.fields.country')} />
                      <RHFTextField name={`addresses.${index}.city`} label={tx('clients.form.fields.city')} />
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                      }}
                    >
                      <RHFTextField name={`addresses.${index}.address`} label={tx('clients.form.fields.address')} />
                      <RHFTextField
                        name={`addresses.${index}.postalCode`}
                        label={tx('clients.form.fields.postalCode')}
                      />
                    </Box>
                    <RHFTextField name={`addresses.${index}.note`} label={tx('clients.form.fields.note')} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        color="error"
                        onClick={() => addressesFieldArray.remove(index)}
                        disabled={addressesFieldArray.fields.length === 1}
                      >
                        {tx('common.actions.delete')}
                      </Button>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {tx('clients.form.sections.socialNetworks')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              <RHFTextField
                name="socialNetworks.email"
                label={tx('common.table.email')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:letter-bold" width={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                name="socialNetworks.telegram"
                label={tx('clients.form.fields.telegram')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="logos:telegram" width={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                name="socialNetworks.instagram"
                label={tx('clients.form.fields.instagram')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="skill-icons:instagram" width={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                name="socialNetworks.facebook"
                label={tx('clients.form.fields.facebook')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="logos:facebook" width={18} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Card>

          <Divider />

          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button onClick={() => router.push(paths.clients.root)}>{tx('common.actions.cancel')}</Button>
            <Button variant="contained" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {tx('common.actions.save')}
            </Button>
          </Stack>
        </Stack>
      </FormProvider>
    </>
  );
}
