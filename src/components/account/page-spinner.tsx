import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Full-height spinner, shown until the browser knows the language and the
 * session.
 */
export function PageSpinner({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50dvh' }}>
      <CircularProgress aria-label={label} />
    </Box>
  );
}
