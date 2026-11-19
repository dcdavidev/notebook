import { AppShell } from '@/components/layout/app-shell';

/**
Layout of the app pages: sidebar, top bar, and page content.
*/
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>;
}
