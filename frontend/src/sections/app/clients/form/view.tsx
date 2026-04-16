import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
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
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { useClientDetailQuery, useCreateClientMutation, useUpdateClientMutation } from '../api/use-clients-api';
import type { ClientAddress, ClientCommunicationLanguage, ClientSocialNetworks } from '../api/types';
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
  communicationLanguage: ClientCommunicationLanguage;
  gender: string;
  maritalStatus: string;
  phones: { country: ClientPhoneCountry; number: string }[];
  addresses: ClientAddress[];
  socialNetworks: ClientSocialNetworks;
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

  const methods = useForm<ClientFormValues>({
    resolver: yupResolver(getClientFormSchema(tx)),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      lastName: '',
      middleName: '',
      birthDate: null,
      communicationLanguage: '',
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
    },
  });

  const { control, handleSubmit, reset } = methods;
  const selectedCommunicationLanguage = methods.watch('communicationLanguage');
  const selectedGender = methods.watch('gender');

  const phonesFieldArray = useFieldArray({
    control,
    name: 'phones',
  });
  const addressesFieldArray = useFieldArray({
    control,
    name: 'addresses',
  });

  const languageOptions = [
    { value: 'uz', icon: 'flagpack:uz', label: tx('pages.clients.form.languages.uz') },
    { value: 'ru', icon: 'flagpack:ru', label: tx('pages.clients.form.languages.ru') },
    { value: 'en', icon: 'flagpack:gb-ukm', label: tx('pages.clients.form.languages.en') },
  ] as const;
  const genderOptions = [
    { value: 'male', icon: 'solar:male-bold', label: tx('pages.users.genders.male') },
    { value: 'female', icon: 'solar:female-bold', label: tx('pages.users.genders.female') },
  ] as const;

  useEffect(() => {
    if (mode !== 'edit' || !detailQuery.data) return;

    reset({
      name: detailQuery.data.name || '',
      lastName: detailQuery.data.lastName || '',
      middleName: detailQuery.data.middleName || '',
      birthDate: detailQuery.data.birthDate || null,
      communicationLanguage: detailQuery.data.communicationLanguage || '',
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
    });
  }, [detailQuery.data, mode, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName.trim(),
      birthDate: values.birthDate || null,
      communicationLanguage: values.communicationLanguage,
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
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        enqueueSnackbar(tx('pages.clients.toasts.created'), { variant: 'success' });
      } else {
        await updateMutation.mutateAsync({ id, ...payload });
        enqueueSnackbar(tx('pages.clients.toasts.updated'), { variant: 'success' });
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
        title={tx('pages.clients.detail.not_found')}
        action={
          <Button onClick={() => router.push(paths.clients.root)} variant="contained">
            {tx('shared.actions.back_to_list')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={mode === 'create' ? tx('pages.clients.form.create_title') : tx('pages.clients.form.edit_title')}
        links={[
          { name: tx('layout.nav.clients'), href: paths.clients.root },
          {
            name: mode === 'create' ? tx('pages.clients.form.create_title') : tx('pages.clients.form.edit_title'),
            href: mode === 'create' ? paths.clients.create : paths.clients.edit(id),
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {tx('pages.clients.form.sections.personal')}
            </Typography>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                }}
              >
                <RHFTextField name="name" label={`${tx('pages.clients.form.fields.name')} *`} />
                <RHFTextField name="lastName" label={tx('pages.clients.form.fields.last_name')} />
                <RHFTextField name="middleName" label={tx('pages.clients.form.fields.middle_name')} />
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <RHFTextField
                  name="birthDate"
                  type="date"
                  label={tx('pages.clients.form.fields.birth_date')}
                  InputLabelProps={{ shrink: true }}
                />
                <RHFTextField name="maritalStatus" select label={tx('pages.clients.form.fields.marital_status')}>
                  <MenuItem value="">{tx('shared.table.all_option')}</MenuItem>
                  <MenuItem value="married">{tx('pages.clients.form.marital.married')}</MenuItem>
                  <MenuItem value="single">{tx('pages.clients.form.marital.single')}</MenuItem>
                </RHFTextField>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {tx('pages.clients.form.fields.communication_language')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 0.75,
                      p: 0.5,
                      borderRadius: 2,
                      bgcolor: 'grey.200',
                      minHeight: 56,
                      alignItems: 'center',
                    }}
                  >
                    {languageOptions.map((option) => {
                      const selected = selectedCommunicationLanguage === option.value;
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            methods.setValue('communicationLanguage', option.value, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                          sx={{
                            minHeight: 44,
                            minWidth: 0,
                            borderRadius: 1.75,
                            lineHeight: 1,
                            px: 1.5,
                            color: 'text.primary',
                            bgcolor: selected ? 'common.white' : 'transparent',
                            boxShadow: selected ? (theme) => theme.customShadows.z8 : 'none',
                            '&:hover': {
                              bgcolor: selected ? 'common.white' : 'action.hover',
                            },
                          }}
                        >
                          <Iconify icon={option.icon} width={20} />
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {tx('pages.clients.form.fields.gender')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 0.5,
                      p: 0.5,
                      borderRadius: 2,
                      bgcolor: 'grey.200',
                      minHeight: 56,
                      alignItems: 'center',
                    }}
                  >
                    {genderOptions.map((option) => {
                      const selected = selectedGender === option.value;
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            methods.setValue('gender', option.value, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                          sx={{
                            minHeight: 44,
                            minWidth: 0,
                            borderRadius: 1.75,
                            lineHeight: 1,
                            px: 1.5,
                            color: 'text.primary',
                            bgcolor: selected ? 'common.white' : 'transparent',
                            boxShadow: selected ? (theme) => theme.customShadows.z8 : 'none',
                            '&:hover': {
                              bgcolor: selected ? 'common.white' : 'action.hover',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify icon={option.icon} width={18} />
                            <Typography variant="body2">{option.label}</Typography>
                          </Stack>
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">{tx('pages.clients.form.sections.phones')}</Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => phonesFieldArray.append({ country: DEFAULT_PHONE_COUNTRY, number: '' })}
              >
                {tx('pages.clients.form.add_phone')}
              </Button>
            </Stack>
            <Stack spacing={2}>
              {phonesFieldArray.fields.map((field, index) => (
                <Stack key={field.id} direction="row" spacing={1.5}>
                  <RHFTextField
                    name={`phones.${index}.country`}
                    label={tx('pages.clients.form.fields.phone_country')}
                    select
                    sx={{ maxWidth: 170 }}
                  >
                    <MenuItem value="uz">🇺🇿 {tx('pages.clients.form.countries.uz')}</MenuItem>
                    <MenuItem value="ru">🇷🇺 {tx('pages.clients.form.countries.ru')}</MenuItem>
                    <MenuItem value="us">🇺🇸 {tx('pages.clients.form.countries.us')}</MenuItem>
                  </RHFTextField>
                  <RHFTextField
                    name={`phones.${index}.number`}
                    label={index === 0 ? `${tx('shared.table.phone')} *` : tx('shared.table.phone')}
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
              <Typography variant="h6">{tx('pages.clients.form.sections.addresses')}</Typography>
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
                {tx('pages.clients.form.add_address')}
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
                      <RHFTextField name={`addresses.${index}.country`} label={tx('pages.clients.form.fields.country')} />
                      <RHFTextField name={`addresses.${index}.city`} label={tx('pages.clients.form.fields.city')} />
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                      }}
                    >
                      <RHFTextField name={`addresses.${index}.address`} label={tx('pages.clients.form.fields.address')} />
                      <RHFTextField
                        name={`addresses.${index}.postalCode`}
                        label={tx('pages.clients.form.fields.postal_code')}
                      />
                    </Box>
                    <RHFTextField name={`addresses.${index}.note`} label={tx('pages.clients.form.fields.note')} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        color="error"
                        onClick={() => addressesFieldArray.remove(index)}
                        disabled={addressesFieldArray.fields.length === 1}
                      >
                        {tx('shared.actions.delete')}
                      </Button>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {tx('pages.clients.form.sections.social_networks')}
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
                label={tx('shared.table.email')}
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
                label={tx('pages.clients.form.fields.telegram')}
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
                label={tx('pages.clients.form.fields.instagram')}
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
                label={tx('pages.clients.form.fields.facebook')}
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
            <Button onClick={() => router.push(paths.clients.root)}>{tx('shared.actions.cancel')}</Button>
            <Button variant="contained" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {tx('shared.actions.save')}
            </Button>
          </Stack>
        </Stack>
      </FormProvider>
    </>
  );
}
