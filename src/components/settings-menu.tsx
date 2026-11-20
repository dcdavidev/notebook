'use client';

import { type MouseEvent, type ReactNode, useState } from 'react';

import { useParams, usePathname, useRouter } from 'next/navigation';

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
  IconLanguage,
  IconMoon,
  IconPalette,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';

import { openCookiePreferences } from '@/lib/consent';
import { isLocale, type Locale, localeNames, locales } from '@/lib/locale';
import {
  readPreferredLocale,
  savePreferredLocale,
} from '@/lib/preferred-locale';
import { usePalette } from '@/theme/palette-context';
import { palettes } from '@/theme/palettes';

const modes = [
  { value: 'light', Icon: IconSun },
  { value: 'dark', Icon: IconMoon },
  { value: 'system', Icon: IconDeviceDesktop },
] as const;

/**
Labels of the menu. It also appears outside the localized pages.
*/
const labels: Record<
  Locale,
  {
    settings: string;
    cookies: string;
    mode: string;
    palette: string;
    language: string;
    modes: Record<(typeof modes)[number]['value'], string>;
  }
> = {
  it: {
    settings: 'Impostazioni',
    cookies: 'Preferenze cookie',
    mode: 'Modalità',
    palette: 'Palette',
    language: 'Lingua',
    modes: { light: 'Chiara', dark: 'Scura', system: 'Sistema' },
  },
  en: {
    settings: 'Settings',
    cookies: 'Cookie preferences',
    mode: 'Mode',
    palette: 'Palette',
    language: 'Language',
    modes: { light: 'Light', dark: 'Dark', system: 'System' },
  },
};

type Section = 'language' | 'mode' | 'palette';

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

interface SettingsMenuProps {
  /**
   * Outside the localized pages, changing the language normally opens the
   * overview in that language. With this flag, the page stays open and
   * only the saved language changes, for example on `/account`.
   */
  stayOnPage?: boolean;
}

/**
 * Settings menu: cookie preferences, language, color
 * mode, and palette. Each group is a section that expands and collapses.
 */
export function SettingsMenu({ stayOnPage = false }: SettingsMenuProps) {
  const { mode, setMode } = useColorScheme();
  const { paletteId, selectPalette } = usePalette();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState<Section | null>(null);
  const params = useParams<{ lang?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  // Language of the localized page, if this is one.
  const lang = isLocale(params.lang) ? params.lang : undefined;
  // Outside the localized pages: the saved choice, or the browser language.
  const [preferredLang, setPreferredLang] = useState<Locale>('en');
  const currentLang = lang ?? preferredLang;
  const text = labels[currentLang];

  const open = (event: MouseEvent<HTMLElement>) => {
    if (!lang) {
      setPreferredLang(readPreferredLocale());
    }
    setAnchor(event.currentTarget);
  };
  const close = () => {
    setAnchor(null);
    setExpanded(null);
  };
  const toggle = (section: Section) => {
    setExpanded((current) => (current === section ? null : section));
  };

  /**
   * Saves the language. On a localized page it opens the same page in that
   * language; elsewhere it opens the overview in that language, unless
   * `stayOnPage` is set.
   */
  const changeLanguage = (next: Locale) => {
    savePreferredLocale(next);
    setPreferredLang(next);
    close();
    if (!lang && stayOnPage) {
      return;
    }
    if (!lang) {
      router.push(`/${next}/overview`);
    } else if (next !== lang) {
      router.replace(`/${next}${pathname.slice(lang.length + 1)}`);
    }
  };

  const currentMode = modes.find((item) => item.value === mode);
  const currentPalette = palettes.find((item) => item.id === paletteId);

  return (
    <>
      <Tooltip title={text.settings}>
        <IconButton
          onClick={open}
          aria-label={text.settings}
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
          <ListItemText>{text.cookies}</ListItemText>
        </MenuItem>
        <Divider />

        <SectionHeader
          icon={<IconLanguage size={20} />}
          label={text.language}
          value={localeNames[currentLang]}
          expanded={expanded === 'language'}
          controls="settings-language"
          onToggle={() => {
            toggle('language');
          }}
        />
        <Collapse
          in={expanded === 'language'}
          id="settings-language"
          unmountOnExit
        >
          {locales.map((item) => (
            <MenuItem
              key={item}
              lang={item}
              selected={currentLang === item}
              onClick={() => {
                changeLanguage(item);
              }}
              sx={{ pl: 4 }}
            >
              <ListItemText inset>{localeNames[item]}</ListItemText>
              {currentLang === item && <IconCheck size={18} />}
            </MenuItem>
          ))}
        </Collapse>

        <SectionHeader
          icon={
            currentMode ? <currentMode.Icon size={20} /> : <IconSun size={20} />
          }
          label={text.mode}
          value={currentMode ? text.modes[currentMode.value] : ''}
          expanded={expanded === 'mode'}
          controls="settings-mode"
          onToggle={() => {
            toggle('mode');
          }}
        />
        <Collapse in={expanded === 'mode'} id="settings-mode" unmountOnExit>
          {modes.map(({ value, Icon }) => (
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
              <ListItemText>{text.modes[value]}</ListItemText>
              {mode === value && <IconCheck size={18} />}
            </MenuItem>
          ))}
        </Collapse>

        <SectionHeader
          icon={<IconPalette size={20} />}
          label={text.palette}
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
