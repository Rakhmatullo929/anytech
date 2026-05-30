import { useEffect, useRef } from 'react';
import { m, useAnimation } from 'framer-motion';

import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

type Props = {
  itemCount: number;
  subtotal: number;
  onClick: () => void;
};

export default function PosMobileCartFab({ itemCount, subtotal, onClick }: Props) {
  const theme = useTheme();
  const controls = useAnimation();
  const prevCount = useRef(itemCount);

  // Haptic-style visual bounce whenever an item is added / removed
  useEffect(() => {
    if (itemCount !== prevCount.current) {
      controls.start({
        scale: [1, 1.18, 0.93, 1.04, 1],
        transition: { duration: 0.42, times: [0, 0.3, 0.6, 0.8, 1] },
      });
      prevCount.current = itemCount;
    }
  }, [itemCount, controls]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: (t) => t.zIndex.fab,
        display: { xs: 'flex', md: 'none' },
      }}
    >
      <m.div animate={controls} style={{ display: 'flex' }}>
        <ButtonBase
          onClick={onClick}
          sx={{
            borderRadius: 10,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 2.5,
            py: 1.5,
            gap: 1.5,
            display: 'flex',
            alignItems: 'center',
            minWidth: 160,
            boxShadow: `0 8px 28px ${alpha(theme.palette.primary.main, 0.5)}`,
            transition: 'box-shadow 0.2s',
            '&:active': {
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
          }}
        >
          {/* Cart icon with item-count badge */}
          <Box sx={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
            <Iconify icon="solar:cart-large-4-bold" width={26} />

            {itemCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -7,
                  right: -8,
                  minWidth: 18,
                  height: 18,
                  borderRadius: '9px',
                  bgcolor: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 0.4,
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1 }}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            {itemCount === 0 ? '—' : fCurrency(subtotal)}
          </Typography>
        </ButtonBase>
      </m.div>
    </Box>
  );
}
