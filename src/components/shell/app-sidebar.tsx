'use client';

import { useTranslations } from 'next-intl';

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from '@tabler/icons-react';

import { Link } from '@/i18n/navigation';

interface AppSidebarProps {
  /**
  Shows only the toggle button.
  */
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  /**
  Called after a link is chosen, to close the mobile drawer.
  */
  onNavigate?: () => void;
}

/**
 * Sidebar with the site title and the button that collapses it into a
 * narrow rail. The sections will be added here as they are built.
 */
export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: AppSidebarProps) {
  const t = useTranslations('Shell');
  const toggleLabel = t(collapsed ? 'expandSidebar' : 'collapseSidebar');

  return (
    <Stack sx={{ height: '100%', py: 1.5, px: 1 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 1,
          minHeight: 40,
        }}
      >
        {!collapsed && (
          <Typography
            component={Link}
            href="/overview"
            onClick={onNavigate}
            sx={{
              fontFamily: 'var(--nb-font-title)',
              fontSize: '1.6rem',
              color: 'text.primary',
              textDecoration: 'none',
            }}
          >
            Notebook
          </Typography>
        )}
        {onToggleCollapsed && (
          <Tooltip title={toggleLabel} placement="right">
            <IconButton
              onClick={onToggleCollapsed}
              aria-label={toggleLabel}
              size="small"
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={20} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={20} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );
}
