// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
// hooks
import { useAppUserProfile } from 'src/hooks/use-app-user-profile';
// components
import Label from 'src/components/label';

// ----------------------------------------------------------------------

export default function NavUpgrade() {
  const { user } = useAppUserProfile();

  const avatarInitial =
    user?.displayName?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    'U';

  const roleLabel = (user?.role || 'user')
    .toString()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Box
      sx={{
        mx: 2,
        mb: 3,
        px: 2,
        py: 2.5,
        borderRadius: 2,
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        bgcolor: 'background.neutral',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Box>
          <Avatar
            src={user?.photoURL || undefined}
            alt={user?.displayName}
            sx={{ width: 56, height: 56, fontSize: 24 }}
          >
            {avatarInitial}
          </Avatar>
        </Box>

        <Stack spacing={0.5} sx={{ width: 1, textAlign: 'center' }}>
          <Typography variant="subtitle2" noWrap>
            {user?.displayName || 'Unknown user'}
          </Typography>

          <Typography variant="body2" noWrap sx={{ color: 'text.disabled' }}>
            {user?.email || '-'}
          </Typography>
        </Stack>

        <Divider flexItem sx={{ borderStyle: 'dashed' }} />

        <Label color="primary" variant="soft" sx={{ px: 1.2 }}>
          {roleLabel}
        </Label>
      </Stack>
    </Box>
  );
}
