import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { IconArrowRight, IconBook2, IconCode } from '@tabler/icons-react';

import { SurfaceCard } from './surface-card';

import { LinkButton } from '@/components/link-button';
import { courses, type CourseStatus } from '@/content/sample-data';

const statusColor: Record<CourseStatus, 'primary' | 'secondary' | 'default'> = {
  Published: 'primary',
  'In progress': 'secondary',
  Planned: 'default',
};

export function CoursesCard() {
  return (
    <SurfaceCard
      title="Courses"
      icon={<IconBook2 size={20} />}
      action={
        <LinkButton
          href="/courses"
          size="small"
          endIcon={<IconArrowRight size={16} />}
        >
          View all
        </LinkButton>
      }
    >
      <TableContainer>
        <Table size="small" sx={{ '& td, & th': { borderColor: 'divider' } }}>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  color: 'text.secondary',
                  fontWeight: 500,
                  bgcolor:
                    'color-mix(in oklch, var(--nb-text) 4%, transparent)',
                  border: 0,
                },
                '& th:first-of-type': { borderRadius: '10px 0 0 10px' },
                '& th:last-of-type': { borderRadius: '0 10px 10px 0' },
              }}
            >
              <TableCell>Course</TableCell>
              <TableCell align="right">Lessons</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                Level
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} hover>
                <TableCell>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', gap: 1.5 }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor:
                          'color-mix(in oklch, var(--nb-primary) 15%, transparent)',
                        color: 'primary.main',
                      }}
                    >
                      <IconCode size={18} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 600 }}
                      >
                        {course.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {course.topic}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="right">{course.lessons}</TableCell>
                <TableCell>
                  <Chip
                    label={course.status}
                    size="small"
                    color={statusColor[course.status]}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {course.level}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SurfaceCard>
  );
}
