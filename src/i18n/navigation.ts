import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/**
Links and router that add the language prefix automatically.
*/
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
