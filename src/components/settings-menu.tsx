'use client';

import { type MouseEvent, type ReactNode, useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useColorScheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

import {
  IconCheck,
  IconChevronDown,
  IconCookie,
  IconDeviceDesktop,
  IconMoon,
  IconPalette,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';

import { openCookiePreferences } from '@/lib/consent';
import { usePalette } from '@/theme/palette-context';
import { palettes } from '@/theme/palettes';

const modes = [
  { value: 'light', label: 'Light', Icon: IconSun },
  { value: 'dark', label: 'Dark', Icon: IconMoon },
  { value: 'system', label: 'System', Icon: IconDeviceDesktop },
] as const;

type Section = 'mode' | 'palette';

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <Stack direction="row" sx={{ borderRadius: 1, overflow: 'hidden' }}>
      {colors.map((color) => (
        <Box key={color} sx={{ width: 14, height: 20, bgcolor: color }} />
      ))}
    </Stack>
  );
}

interface SectionHeaderProps {
  icon: ReactNode;
  label: string;
  value: string;
  expanded: boolean;
  controls: string;
  onToggle: () => void;
}

/**
Menu row that expands or collapses a group of options.
*/
function SectionHeader({
  icon,
  label,
  value,
  expanded,
  controls,
  onToggle,
}: SectionHeaderProps) {
  return (
    <MenuItem
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={label} secondary={value} />
      <Box
        component="span"
        sx={{
          display: 'flex',
          ml: 2,
          transition: 'transform 200ms',
          transform: expanded ? 'rotate(180deg)' : 'none',
        }}
      >
        <IconChevronDown size={18} />
      </Box>
    </MenuItem>
  );
}

/**
 * Settings menu: cookie preferences, color mode, and palette. Mode and
 * palette are sections that expand and collapse.
 */
export function SettingsMenu() {
  const { mode, setMode } = useColorScheme();
  const { paletteId, selectPalette } = usePalette();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState<Section | null>(null);

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
  };
  const close = () => {
    setAnchor(null);
    setExpanded(null);
  };
  const toggle = (section: Section) => {
    setExpanded((current) => (current === section ? null : section));
  };

  const currentMode = modes.find((item) => item.value === mode);
  const currentPalette = palettes.find((item) => item.id === paletteId);

  return (
    <>
      <Tooltip title="Settings">
        <IconButton
          onClick={open}
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={anchor ? 'true' : undefined}
          color="inherit"
        >
          <IconSettings />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        slotProps={{ paper: { sx: { minWidth: 280 } } }}
      >
        <MenuItem
          onClick={() => {
            close();
            openCookiePreferences();
          }}
        >
          <ListItemIcon>
            <IconCookie size={20} />
          </ListItemIcon>
          <ListItemText>Cookie preferences</ListItemText>
        </MenuItem>
        <Divider />

        <SectionHeader
          icon={
            currentMode ? <currentMode.Icon size={20} /> : <IconSun size={20} />
          }
          label="Mode"
          value={currentMode?.label ?? ''}
          expanded={expanded === 'mode'}
          controls="settings-mode"
          onToggle={() => {
            toggle('mode');
          }}
        />
        <Collapse in={expanded === 'mode'} id="settings-mode" unmountOnExit>
          {modes.map(({ value, label, Icon }) => (
            <MenuItem
              key={value}
              selected={mode === value}
              onClick={() => {
                setMode(value);
              }}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText>{label}</ListItemText>
              {mode === value && <IconCheck size={18} />}
            </MenuItem>
          ))}
        </Collapse>

        <SectionHeader
          icon={<IconPalette size={20} />}
          label="Palette"
          value={currentPalette?.name ?? ''}
          expanded={expanded === 'palette'}
          controls="settings-palette"
          onToggle={() => {
            toggle('palette');
          }}
        />
        <Collapse
          in={expanded === 'palette'}
          id="settings-palette"
          unmountOnExit
        >
          {palettes.map((palette) => (
            <MenuItem
              key={palette.id}
              selected={paletteId === palette.id}
              onClick={() => {
                selectPalette(palette.id);
              }}
              sx={{ pl: 4, gap: 1.5 }}
            >
              <Swatches colors={palette.swatches} />
              <ListItemText>{palette.name}</ListItemText>
              {paletteId === palette.id && <IconCheck size={18} />}
            </MenuItem>
          ))}
        </Collapse>
      </Menu>
    </>
  );
}
