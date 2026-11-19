import type { ReactNode } from 'react';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface SurfaceCardProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

/**
Rounded card used by every block of the overview grid.
*/
export function SurfaceCard({
  title,
  icon,
  action,
  children,
}: SurfaceCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: 2.5,
        borderRadius: 5,
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {title && (
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography
            variant="subtitle1"
            component="h2"
            sx={{ fontWeight: 600, flex: 1 }}
          >
            {title}
          </Typography>
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}
