import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconSparkles } from '@tabler/icons-react';

export function HeroCard() {
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 260,
        p: 3,
        borderRadius: 5,
        overflow: 'hidden',
        color: 'var(--nb-text)',
        background: [
          'radial-gradient(circle at 80% 15%, color-mix(in oklch, var(--nb-secondary) 70%, transparent), transparent 55%)',
          'radial-gradient(circle at 10% 100%, color-mix(in oklch, var(--nb-primary) 55%, transparent), transparent 60%)',
          'color-mix(in oklch, var(--nb-background), var(--nb-secondary) 18%)',
        ].join(', '),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Stack direction="row" sx={{ gap: 1 }}>
        <Chip
          icon={<IconSparkles size={16} />}
          label="Free and open source"
          size="small"
          sx={{ bgcolor: 'background.paper' }}
        />
      </Stack>
      <Box>
        <Typography
          variant="h3"
          component="p"
          sx={{ fontWeight: 600, lineHeight: 1.1 }}
        >
          Explore your
          <Box
            component="span"
            sx={{
              display: 'block',
              fontFamily: 'var(--nb-font-title)',
              fontWeight: 400,
              fontSize: '1.15em',
            }}
          >
            notebook
          </Box>
        </Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>
          Courses, study notes, and hobbies in one place.
        </Typography>
      </Box>
    </Box>
  );
}
