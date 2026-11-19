'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IconExternalLink, IconNotebook } from '@tabler/icons-react';

import { navigation } from './navigation';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <Stack sx={{ height: '100%', p: 2, gap: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 1 }}>
        <IconNotebook size={26} />
        <Typography
          component="span"
          sx={{ fontFamily: 'var(--nb-font-title)', fontSize: '1.6rem' }}
        >
          Notebook
        </Typography>
      </Stack>

      <Box
        component="nav"
        aria-label="Main"
        sx={{ flex: 1, overflowY: 'auto' }}
      >
        {navigation.map((section) => (
          <List
            key={section.title}
            dense
            subheader={
              <Typography
                variant="caption"
                component="div"
                sx={{ px: 1.5, pt: 1.5, pb: 0.5, color: 'text.secondary' }}
              >
                {section.title}
              </Typography>
            }
          >
            {section.items.map(
              ({ label, href, icon: Icon, badge, external }) => {
                const isSelected = !external && pathname === href;
                return (
                  <ListItemButton
                    key={href}
                    component={Link}
                    href={href}
                    selected={isSelected}
                    onClick={onNavigate}
                    {...(external && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                    sx={{
                      borderRadius: 2,
                      mb: 0.25,
                      '&.Mui-selected': {
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                      <Icon size={19} />
                    </ListItemIcon>
                    <ListItemText primary={label} />
                    {badge !== undefined && (
                      <Chip
                        label={badge}
                        size="small"
                        color="primary"
                        sx={{ height: 20, minWidth: 20 }}
                      />
                    )}
                    {external && <IconExternalLink size={14} />}
                  </ListItemButton>
                );
              }
            )}
          </List>
        ))}
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Avatar
          src="https://github.com/dcdavidev.png"
          alt="Davide Di Criscito"
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            Davide Di Criscito
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
            @dcdavidev
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}
