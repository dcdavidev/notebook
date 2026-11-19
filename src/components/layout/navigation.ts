import {
  type Icon,
  IconBook2,
  IconBookmark,
  IconBrandGithub,
  IconDownload,
  IconLayoutDashboard,
  IconMessageCircle,
  IconNotes,
  IconPalette,
  IconSettings,
} from '@tabler/icons-react';

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
  /**
  Small counter shown on the right.
  */
  badge?: number;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Overview', href: '/overview', icon: IconLayoutDashboard },
      { label: 'Courses', href: '/courses', icon: IconBook2 },
      { label: 'Study notes', href: '/notes', icon: IconNotes },
      { label: 'Hobbies', href: '/hobbies', icon: IconPalette },
    ],
  },
  {
    title: 'Library',
    items: [
      { label: 'Downloads', href: '/downloads', icon: IconDownload },
      { label: 'Bookmarks', href: '/bookmarks', icon: IconBookmark, badge: 2 },
    ],
  },
  {
    title: 'Other',
    items: [
      { label: 'Settings', href: '/settings', icon: IconSettings },
      {
        label: 'Feedback',
        href: 'https://github.com/dcdavidev/notebook/issues',
        icon: IconMessageCircle,
        external: true,
      },
      {
        label: 'Source code',
        href: 'https://github.com/dcdavidev/notebook',
        icon: IconBrandGithub,
        external: true,
      },
    ],
  },
];
