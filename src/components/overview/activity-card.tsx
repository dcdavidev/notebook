import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconChartBar } from '@tabler/icons-react';

import { SurfaceCard } from './surface-card';

import { notesPerMonth } from '@/content/sample-data';

export function ActivityCard() {
  const total = notesPerMonth.reduce((sum, { notes }) => sum + notes, 0);
  const max = Math.max(...notesPerMonth.map(({ notes }) => notes));
  const last = notesPerMonth.at(-1);
  const previous = notesPerMonth.at(-2);
  const change =
    last && previous && previous.notes > 0
      ? Math.round(((last.notes - previous.notes) / previous.notes) * 100)
      : 0;

  return (
    <SurfaceCard title="Notes published" icon={<IconChartBar size={20} />}>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
          {total}
        </Typography>
        <Chip
          label={`${change > 0 ? '+' : ''}${change}%`}
          size="small"
          color={change >= 0 ? 'secondary' : 'default'}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          in the last {notesPerMonth.length} months
        </Typography>
      </Stack>

      <Stack
        direction="row"
        role="img"
        aria-label={`Notes per month: ${notesPerMonth
          .map(({ month, notes }) => `${month} ${notes}`)
          .join(', ')}`}
        sx={{ flex: 1, minHeight: 140, alignItems: 'flex-end', gap: 1.5 }}
      >
        {notesPerMonth.map(({ month, notes }, index) => {
          const isLast = index === notesPerMonth.length - 1;
          return (
            <Stack
              key={month}
              sx={{ flex: 1, alignItems: 'center', gap: 0.75, height: '100%' }}
            >
              <Box
                sx={{
                  flex: 1,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: `${(notes / max) * 100}%`,
                    borderRadius: 2,
                    bgcolor: isLast
                      ? 'primary.main'
                      : 'color-mix(in oklch, var(--nb-primary) 35%, transparent)',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {month}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </SurfaceCard>
  );
}
