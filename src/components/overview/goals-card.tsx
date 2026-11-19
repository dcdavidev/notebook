import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconTarget } from '@tabler/icons-react';

import { SurfaceCard } from './surface-card';

import { goals } from '@/content/sample-data';

const segments = 24;

function SubGoal({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'primary' | 'secondary';
}) {
  return (
    <Box sx={{ flex: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.75 }}>
        <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
          {value}%
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        aria-label={label}
        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

export function GoalsCard() {
  const filled = Math.round((goals.yearly / 100) * segments);

  return (
    <SurfaceCard title="Study plan" icon={<IconTarget size={20} />}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            component="p"
            sx={{ fontWeight: 700, color: 'primary.main' }}
          >
            {goals.yearly}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            of the yearly plan
          </Typography>
        </Box>
        <Stack
          direction="row"
          role="img"
          aria-label={`${goals.yearly}% of the yearly plan completed`}
          sx={{ flex: 1, height: 28, gap: '3px' }}
        >
          {Array.from({ length: segments }, (_, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                borderRadius: 0.5,
                bgcolor:
                  index < filled
                    ? 'primary.main'
                    : 'color-mix(in oklch, var(--nb-text) 10%, transparent)',
              }}
            />
          ))}
        </Stack>
      </Stack>
      <Stack direction="row" sx={{ gap: 3 }}>
        <SubGoal label="courses" value={goals.courses} color="primary" />
        <SubGoal label="notes" value={goals.notes} color="secondary" />
      </Stack>
    </SurfaceCard>
  );
}
