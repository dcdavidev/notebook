'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import {
  IconBrandGithub,
  IconDownload,
  IconMenu2,
  IconSearch,
} from '@tabler/icons-react';

import { SettingsMenu } from '@/components/settings-menu';

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      <IconButton
        onClick={onOpenMenu}
        aria-label="Open navigation"
        sx={{ display: { md: 'none' } }}
      >
        <IconMenu2 />
      </IconButton>

      <Box
        component="form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          maxWidth: 420,
          px: 1.5,
          py: 0.5,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <IconSearch size={18} />
        <InputBase
          placeholder="Search courses, notes, hobbies…"
          inputProps={{ 'aria-label': 'Search' }}
          sx={{ flex: 1, fontSize: 14 }}
        />
        <Box
          component="kbd"
          sx={{
            display: { xs: 'none', sm: 'block' },
            px: 0.75,
            borderRadius: 1,
            fontSize: 12,
            border: 1,
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        >
          Ctrl K
        </Box>
      </Box>

      <Box sx={{ flex: 1 }} />

      <SettingsMenu />
      <Tooltip title="Source code">
        <IconButton
          href="https://github.com/dcdavidev/notebook"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source code on GitHub"
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          <IconBrandGithub />
        </IconButton>
      </Tooltip>
      <Button
        variant="contained"
        disableElevation
        endIcon={<IconDownload size={18} />}
        sx={{ borderRadius: 3, display: { xs: 'none', sm: 'inline-flex' } }}
      >
        Download notes
      </Button>
    </Stack>
  );
}
