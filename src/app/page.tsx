import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconBook2, IconNotes } from '@tabler/icons-react';

import { LinkButton } from '@/components/link-button';
import { ActivityCard } from '@/components/overview/activity-card';
import { CoursesCard } from '@/components/overview/courses-card';
import { GoalsCard } from '@/components/overview/goals-card';
import { HeroCard } from '@/components/overview/hero-card';
import { TipsCard } from '@/components/overview/tips-card';

export default function Home() {
  return (
    <Stack sx={{ gap: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ alignItems: { sm: 'flex-end' }, gap: 2 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Overview
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Your courses, study notes, and hobbies — all in one place.
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1 }}>
          <LinkButton
            href="/notes"
            variant="outlined"
            startIcon={<IconNotes size={18} />}
            sx={{ borderRadius: 3 }}
          >
            Study notes
          </LinkButton>
          <LinkButton
            href="/courses"
            variant="outlined"
            startIcon={<IconBook2 size={18} />}
            sx={{ borderRadius: 3 }}
          >
            Courses
          </LinkButton>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <HeroCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ActivityCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <CoursesCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack sx={{ gap: 2, height: '100%' }}>
            <GoalsCard />
            <Box sx={{ flex: 1 }}>
              <TipsCard />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
