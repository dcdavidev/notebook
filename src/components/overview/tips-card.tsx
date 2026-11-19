import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconBulb } from '@tabler/icons-react';

import { SurfaceCard } from './surface-card';

import { tips } from '@/content/sample-data';

export function TipsCard() {
  return (
    <SurfaceCard title="Study tips" icon={<IconBulb size={20} />}>
      <Stack sx={{ gap: 1.5 }}>
        <Box
          sx={{
            alignSelf: 'flex-end',
            maxWidth: '85%',
            px: 1.5,
            py: 1,
            borderRadius: '14px 14px 4px 14px',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2">How can I study better?</Typography>
        </Box>
        {tips.map((tip) => (
          <Box
            key={tip}
            sx={{
              maxWidth: '90%',
              px: 1.5,
              py: 1,
              borderRadius: '14px 14px 14px 4px',
              bgcolor:
                'color-mix(in oklch, var(--nb-primary) 14%, transparent)',
            }}
          >
            <Typography variant="body2">{tip}</Typography>
          </Box>
        ))}
      </Stack>
    </SurfaceCard>
  );
}
