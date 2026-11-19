'use client';

import Link from 'next/link';

import Button, { type ButtonProps } from '@mui/material/Button';

/**
 * MUI Button rendered as a Next.js Link. It lives in a Client Component
 * because Server Components cannot pass `Link` (a function) as a prop.
 */
export function LinkButton(props: ButtonProps<typeof Link>) {
  return <Button component={Link} {...props} />;
}
