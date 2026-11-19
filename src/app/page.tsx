import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import {
  IconBook2,
  IconBrandGithub,
  IconDownload,
  IconNotebook,
} from '@tabler/icons-react';

import { ThemeSwitcher } from '@/components/theme-switcher';

export default function Home() {
  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconNotebook />
          <Typography
            component="span"
            sx={{
              flexGrow: 1,
              fontFamily: 'var(--nb-font-title)',
              fontSize: '1.75rem',
            }}
          >
            Notebook
          </Typography>
          <ThemeSwitcher />
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography
              variant="h1"
              color="primary"
              sx={{
                fontFamily: 'var(--nb-font-title)',
                fontSize: { xs: '3.5rem', md: '5rem' },
              }}
            >
              Notebook
            </Typography>
            <Typography variant="h5" component="p" color="text.secondary">
              Digital notebook for free programming courses, downloadable study
              notes, and personal hobbies.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
          >
            <Button variant="contained" startIcon={<IconBook2 />}>
              Courses
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<IconDownload />}
            >
              Study notes
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconBrandGithub />}
              href="https://github.com/dcdavidev/notebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <Chip label="Typography" color="primary" size="small" />
                <Chip label="Preview" variant="outlined" size="small" />
              </Stack>
              <Typography>
                Body text uses Inter. Inline quotes use PT Mono, for example{' '}
                <q>talk is cheap, show me the code</q>, and so does inline code
                such as <code>pnpm dev</code>.
              </Typography>
              <Box component="blockquote">
                <Typography>
                  Blockquotes use PT Mono with an accent border in the secondary
                  color of the palette.
                </Typography>
              </Box>
              <Box component="pre">
                <code>
                  {`export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`}
                </code>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
