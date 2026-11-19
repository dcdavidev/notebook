'use client';

import { type MouseEvent, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useColorScheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

import {
  IconCheck,
  IconDeviceDesktop,
  IconMoon,
  IconPalette,
  IconSun,
} from '@tabler/icons-react';

import { usePalette } from '@/theme/palette-context';
import { palettes } from '@/theme/palettes';

const modes = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'dark', label: 'Dark', Icon: IconMoon },
  { value: 'system', label: 'System', Icon: IconDeviceDesktop },
] as const;

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <Stack direction="row" sx={{ borderRadius: 1, overflow: 'hidden' }}>
      {colors.map((color) => (
        <Box key={color} sx={{ width: 14, height: 20, bgcolor: color }} />
      ))}
    </Stack>
  );
}

export function ThemeSwitcher() {
  const { mode, setMode } = useColorScheme();
  const { paletteId, selectPalette } = usePalette();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
  };
  const close = () => {
    setAnchor(null);
  };

  return (
    <>
      <Tooltip title="Theme">
        <IconButton
          onClick={open}
          aria-label="Change theme"
          aria-haspopup="menu"
          aria-expanded={anchor ? 'true' : undefined}
          color="inherit"
        >
          <IconPalette />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <ListSubheader>Mode</ListSubheader>
        {modes.map(({ value, label, Icon }) => (
          <MenuItem
            key={value}
            selected={mode === value}
            onClick={() => {
              setMode(value);
            }}
          >
            <ListItemIcon>
              <Icon size={20} />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
            {mode === value && <IconCheck size={18} />}
          </MenuItem>
        ))}
        <ListSubheader>Palette</ListSubheader>
        {palettes.map((palette) => (
          <MenuItem
            key={palette.id}
            selected={paletteId === palette.id}
            onClick={() => {
              selectPalette(palette.id);
            }}
            sx={{ gap: 1.5 }}
          >
            <Swatches colors={palette.swatches} />
            <ListItemText>{palette.name}</ListItemText>
            {paletteId === palette.id && <IconCheck size={18} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
