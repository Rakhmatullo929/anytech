import { useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { useSearchParams } from 'src/routes/hook';
// config
import { PATH_AFTER_LOGIN } from 'src/config-global';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import { useLoginMutation } from 'src/auth/api';
import { useLocales } from 'src/locales';
// components
import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { getAuthFormErrorMessage } from 'src/utils/api-error-messages';
import { getPhonePrefix } from 'src/auth/utils/phone-rules';
import { formatUzPhoneInput, getLoginSchema, normalizeLoginPayload } from './utils/login-schema';
// ----------------------------------------------------------------------

type FormValuesProps = {
  phone: string;
  password: string;
};

export default function JwtLoginView() {
  const loginMutation = useLoginMutation();
  const { tx } = useLocales();

  const [errorMsg, setErrorMsg] = useState('');

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  const loginSchema = getLoginSchema(tx);
  const phonePrefix = getPhonePrefix();

  const defaultValues = {
    phone: '',
    password: '',
  };

  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(loginSchema),
    defaultValues,
  });

  const { handleSubmit, formState: { isSubmitting }, watch, setValue } = methods;
  const watchedPhone = watch('phone');

  useEffect(() => {
    const formatted = formatUzPhoneInput(watchedPhone || '');
    if (watchedPhone !== formatted) {
      setValue('phone', formatted, { shouldValidate: true });
    }
  }, [setValue, watchedPhone]);

  const onSubmit = useCallback(
    async (data: FormValuesProps) => {
      try {
        setErrorMsg('');
        await loginMutation.mutateAsync(normalizeLoginPayload(data));
        window.location.href = returnTo || PATH_AFTER_LOGIN;
      } catch (error) {
        console.error(error);
        setErrorMsg(getAuthFormErrorMessage(error, 'login'));
      }
    },
    [loginMutation, returnTo]
  );

  const renderHead = (
    <Stack spacing={2} sx={{ mb: 5 }}>
      <Typography variant="h4">Sign in to Minimal</Typography>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      {!!errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <RHFTextField
        name="phone"
        label={`${tx('shared.table.phone')} *`}
        placeholder="90 123 45 67"
        inputProps={{ inputMode: 'tel' }}
        sx={{
          '& .MuiInputBase-root': { height: 54 },
          '& input': { letterSpacing: '0.03em' },
        }}
        onChange={(event) => {
          setValue('phone', formatUzPhoneInput(event.target.value), {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  pr: 1,
                }}
              >
                <Iconify width={18} icon="flagpack:uz" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  UZ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {phonePrefix}
                </Typography>
              </Box>
            </InputAdornment>
          ),
        }}
      />

      <RHFTextField
        name="password"
        label="Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Link variant="body2" color="inherit" underline="always" sx={{ alignSelf: 'flex-end' }}>
        Forgot password?
      </Link>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting || loginMutation.isPending}
      >
        Login
      </LoadingButton>
    </Stack>
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      {renderHead}

      {renderForm}
    </FormProvider>
  );
}
