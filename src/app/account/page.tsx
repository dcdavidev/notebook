import type { Metadata } from 'next';

import { AccountPage } from '@/components/account/account-page';

export const metadata: Metadata = {
  title: 'Account · Notebook',
  robots: { index: false },
};

/**
 * Account settings. It has no language in the URL: the browser picks the
 * saved language, and all account data loads in the browser, so the page
 * itself stays static.
 */
export default function Page() {
  return <AccountPage />;
}
