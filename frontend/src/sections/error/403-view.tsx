import { m } from 'framer-motion';
// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
// assets
import { ForbiddenIllustration } from 'src/assets/illustrations';
// components
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useLocales } from 'src/locales';
import { MotionContainer, varBounce } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function View403() {
  const { tx } = useLocales();

  return (
    <Container component={MotionContainer} maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ mx: 'auto' }}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3">{tx('pages.errors.403.title')}</Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary', maxWidth: 560 }}>
            {tx('pages.errors.403.description')}
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Box sx={{ maxWidth: 360, mx: 'auto' }}>
            <ForbiddenIllustration sx={{ width: 1, height: 'auto' }} />
          </Box>
        </m.div>

        <m.div variants={varBounce().in}>
          <Button component={RouterLink} href={paths.pos} size="large" variant="contained">
            {tx('pages.errors.403.back_to_pos')}
          </Button>
        </m.div>
      </Stack>
    </Container>
  );
}
